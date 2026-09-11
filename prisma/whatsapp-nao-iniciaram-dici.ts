/**
 * Gera a lista de WhatsApp (nome, telefone, link wa.me e mensagem pronta) dos
 * alunos do DICI que nunca começaram nenhuma aula — mesmo grupo do
 * alunos-sem-inicio-dici.ts, com a conta da equipe (Dra. Vera) fora da lista.
 *
 *   npx tsx prisma/whatsapp-nao-iniciaram-dici.ts caminho/da/lista.txt
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";
import { writeFileSync } from "node:fs";

config({ path: ".env.local" });
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

const SLUG = "dici-neurogastroenterologia-2026";
const LINK_CURSO = "https://www.nuvemensino.com.br/dashboard/cursos/" + SLUG;

// Segunda conta da Dra. Vera é da equipe, não de aluna.
const EXCLUIR = new Set(["veraluciaangeloandrade@gmail.com"]);

// Nomes cadastrados como "Dra. Fulana" ou "Dr. Fulano": pula o título, senão a
// mensagem sai "Oi, Dra.!" em vez de "Oi, Fulana!".
const TITULO = /^(dr|dra|drª|dr[ao]?|prof|profª|profa)\.?$/i;
const primeiroNome = (n: string | null) => {
  const partes = (n ?? "Aluno").trim().split(/\s+/);
  return partes.find((p) => !TITULO.test(p)) ?? partes[0] ?? "Aluno";
};

function mensagem(nome: string, temCredencial: boolean): string {
  if (temCredencial) {
    return `Oi, ${nome}! Aqui é da equipe do Nu.V.E.M Ensino 🎓 Vimos que sua matrícula no Aperfeiçoamento em DICI está ativa, mas você ainda não começou as aulas. Sem pressa nem prazo apertado: as aulas ficam gravadas na plataforma e você assiste no seu ritmo, começando por onde quiser. Que tal dar o primeiro passo hoje? ${LINK_CURSO} Qualquer dificuldade para entrar, me chama por aqui que a gente resolve na hora!`;
  }
  return `Oi, ${nome}! Aqui é da equipe do Nu.V.E.M Ensino 🎓 Vimos que sua matrícula no Aperfeiçoamento em DICI está ativa, mas você ainda não conseguiu configurar seu acesso à plataforma. Para entrar pela primeira vez, é só ir em "Esqueci minha senha" na tela de login (${LINK_CURSO}) usando o e-mail que você cadastrou — em 1 minuto você já está com acesso liberado. Qualquer dificuldade, me chama por aqui que a gente resolve junto!`;
}

function waLink(telefoneBruto: string | null): string | null {
  if (!telefoneBruto) return null;
  const digitos = telefoneBruto.replace(/\D/g, "");
  if (digitos.length < 10) return null;
  const comPais = digitos.startsWith("55") ? digitos : `55${digitos}`;
  return `https://wa.me/${comPais}`;
}

async function main() {
  const saida = process.argv[2];
  if (!saida) { console.error("Informe o arquivo de saída: npx tsx prisma/whatsapp-nao-iniciaram-dici.ts lista.txt"); process.exit(1); }

  const curso = await prisma.course.findUniqueOrThrow({ where: { slug: SLUG }, select: { id: true } });

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: curso.id, status: "ACTIVE", user: { instructor: { is: null } } },
    include: {
      user: { select: { name: true, email: true, phone: true, passwordHash: true, accounts: { select: { provider: true } } } },
      progress: { select: { id: true } },
    },
    orderBy: { enrolledAt: "asc" },
  });

  const alvo = enrollments
    .filter((e) => e.progress.length === 0)
    .filter((e) => !EXCLUIR.has(e.user.email));

  const linhas = alvo.map((e) => {
    const nome = primeiroNome(e.user.name);
    const temCred = !!e.user.passwordHash || e.user.accounts.length > 0;
    const link = waLink(e.user.phone);
    return { nomeCompleto: e.user.name ?? "—", email: e.user.email, nome, temCred, telefone: e.user.phone, link };
  });

  const semTelefone = linhas.filter((l) => !l.link);
  const comTelefone = linhas.filter((l) => l.link);

  const texto = comTelefone
    .map((l) => {
      const msg = mensagem(l.nome, l.temCred);
      return `${l.nomeCompleto} — ${l.email}\n${l.link}${l.temCred ? "" : "  (sem senha ainda)"}\n${msg}\n`;
    })
    .join("\n" + "─".repeat(60) + "\n\n");

  const rodape = semTelefone.length
    ? `\n\n${"─".repeat(60)}\nSEM TELEFONE CADASTRADO (${semTelefone.length}) — contatar por e-mail:\n` +
      semTelefone.map((l) => `${l.nomeCompleto} — ${l.email}`).join("\n")
    : "";

  writeFileSync(saida, texto + rodape, "utf8");

  console.log(`gerado: ${saida}`);
  console.log(`Total: ${linhas.length} | com telefone: ${comTelefone.length} | sem telefone: ${semTelefone.length}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
