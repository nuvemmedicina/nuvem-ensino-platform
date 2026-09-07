/**
 * Estado desejado dos papéis da equipe. Rode sempre que alguém aparecer com
 * o papel errado — é idempotente, só mexe em quem está fora do esperado.
 *
 *   npx tsx prisma/definir-papeis.ts           # simulação, nada muda
 *   npx tsx prisma/definir-papeis.ts --aplicar # grava
 *
 * Contexto: em 01/08/2026, por volta das 13:33, as contas da coordenação
 * foram rebaixadas para STUDENT por causa não identificada. Este arquivo
 * serve de referência do que deveria estar valendo.
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PAPEIS: Record<string, "ADMIN" | "EDITOR"> = {
  "anapgs.mkt@gmail.com": "ADMIN",
  "nuvem.ensino@gmail.com": "ADMIN",
  "rafaelleao2001@gmail.com": "ADMIN",
  "vera_angelo@hotmail.com": "ADMIN",
  // Editor: cria e edita conteúdo, sem alcançar pagamentos, cupons,
  // matrículas, usuários nem os dados dos alunos.
  "wallaceferreiras1@gmail.com": "EDITOR",
};

async function main() {
  const aplicar = process.argv.includes("--aplicar");
  console.log(aplicar ? "MODO GRAVAÇÃO\n" : "SIMULAÇÃO — nada será alterado\n");

  for (const [email, esperado] of Object.entries(PAPEIS)) {
    const atual = await prisma.user.findUnique({ where: { email }, select: { name: true, role: true } });
    if (!atual) { console.log(`!! ${email.padEnd(30)} NAO EXISTE — pulado`); continue; }
    if (atual.role === esperado) { console.log(`=  ${email.padEnd(30)} já é ${esperado}`); continue; }

    if (!aplicar) { console.log(`.  ${email.padEnd(30)} ${atual.role} -> ${esperado}`); continue; }

    const novo = await prisma.user.update({ where: { email }, data: { role: esperado }, select: { role: true } });
    console.log(`OK ${email.padEnd(30)} ${atual.role} -> ${novo.role}  (${atual.name ?? ""})`);
  }

  const elevados = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "EDITOR"] } },
    select: { email: true, role: true },
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });
  console.log(`\nQUEM ALCANÇA O /admin (${elevados.length}):`);
  for (const u of elevados) console.log(`  ${u.role.padEnd(7)} ${u.email}`);
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
