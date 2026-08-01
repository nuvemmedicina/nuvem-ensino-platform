/**
 * Aplica as migrações do Prisma tolerando builds simultâneos.
 *
 * O "prisma migrate deploy" pega um advisory lock de sessão (72707369) e
 * desiste depois de 10 segundos com P1002. Isso causa dois problemas:
 *
 *  1. Deploys disparados juntos se atropelam — o segundo cai antes que o
 *     primeiro termine, mesmo estando tudo certo com o banco.
 *  2. O lock pode ficar órfão. Como a conexão passa pelo pgbouncer, o backend
 *     sobrevive ao cliente que o abriu e volta para o pool da aplicação ainda
 *     segurando o lock. A partir daí todo deploy falha, até alguém encerrar
 *     aquela sessão à mão.
 *
 * Por tentativa: libera lock comprovadamente órfão, roda o migrate, e se cair
 * em P1002 espera e tenta de novo.
 *
 * A migração alheia em andamento nunca é derrubada: só encerramos a sessão que
 * segura o lock quando ela está 'idle' há mais de IDLE_MIN_SEGUNDOS, ou seja,
 * quando não há migração nenhuma acontecendo ali.
 */

import { neon } from "@neondatabase/serverless";
import { spawnSync } from "node:child_process";
import { config } from "dotenv";

// Na Vercel as variáveis já vêm do ambiente e o dotenv não sobrescreve nada.
// Isso é só para o "npm run build" rodar igual na máquina de quem desenvolve.
config({ path: ".env.local" });

const LOCK_ID = 72707369;
const TENTATIVAS = 5;
const ESPERA_MS = [0, 5_000, 10_000, 20_000, 30_000];
const IDLE_MIN_SEGUNDOS = 30;

// O migrate precisa da conexão direta: o pooler não serve para DDL.
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

const dorme = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Encerra a sessão que segura o lock de migração quando ela está claramente
 * abandonada. Nunca é fatal: se falhar, o migrate tenta assim mesmo.
 */
async function liberarLockOrfao() {
  if (!url) return;
  try {
    const sql = neon(url);
    const orfaos = await sql`
      SELECT a.pid, a.state_change, pg_terminate_backend(a.pid) AS encerrada
      FROM pg_locks l
      JOIN pg_stat_activity a ON l.pid = a.pid
      WHERE l.locktype = 'advisory'
        AND l.classid = 0
        AND l.objid = ${LOCK_ID}
        AND l.granted = true
        AND a.pid <> pg_backend_pid()
        AND a.state = 'idle'
        AND a.state_change < now() - make_interval(secs => ${IDLE_MIN_SEGUNDOS})
    `;
    for (const o of orfaos) {
      console.log(`[migrate] Lock órfão liberado: sessão ${o.pid}, ociosa desde ${o.state_change}.`);
    }
  } catch (e) {
    console.log(`[migrate] Não deu para checar locks órfãos: ${e.message}`);
  }
}

function rodarMigrate() {
  // Comando inteiro como string: com shell e lista de argumentos o Node avisa
  // que os argumentos não são escapados (DEP0190). Aqui não há entrada externa,
  // mas string única evita o aviso e deixa claro que o comando é fixo.
  return spawnSync("npx prisma migrate deploy", {
    encoding: "utf8",
    shell: true,
    env: url ? { ...process.env, DATABASE_URL: url } : process.env,
  });
}

for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
  await liberarLockOrfao();

  const r = rodarMigrate();
  const saida = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  if (saida.trim()) console.log(saida.trimEnd());

  if (r.status === 0) process.exit(0);

  // P1002 = não conseguiu o advisory lock. É o único caso que vale repetir:
  // qualquer outro erro é problema real da migração e repetir só esconderia.
  if (!saida.includes("P1002")) {
    console.error("[migrate] Falhou por outro motivo que não disputa de lock. Abortando.");
    process.exit(r.status ?? 1);
  }

  if (tentativa === TENTATIVAS) break;

  const espera = ESPERA_MS[tentativa];
  console.log(`[migrate] Lock ocupado (tentativa ${tentativa}/${TENTATIVAS}). Nova tentativa em ${espera / 1000}s.`);
  await dorme(espera);
}

console.error(
  `[migrate] Desisti após ${TENTATIVAS} tentativas: o lock ${LOCK_ID} segue ocupado.\n` +
  `[migrate] Se não houver outro deploy rodando, alguma sessão está segurando o lock sem estar ociosa.`
);
process.exit(1);
