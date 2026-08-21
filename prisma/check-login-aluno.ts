/** Diagnostica por que um aluno não consegue entrar: tokens de reset + histórico de e-mails.
 *  Só leitura.
 *  uso: npx tsx prisma/check-login-aluno.ts email@aluno.com
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const email = process.argv[2]?.trim().toLowerCase();
if (!email) { console.error("informe o e-mail"); process.exit(1); }

async function main() {
  const tokens = await prisma.verificationToken.findMany({
    where: { identifier: { in: [`reset:${email}`, `verify:${email}`] } },
  });
  console.log(`TOKENS pendentes (${tokens.length}):`);
  for (const t of tokens) {
    const vivo = t.expires > new Date();
    console.log(`  ${t.identifier} | expira ${t.expires.toLocaleString("pt-BR")} | ${vivo ? "VÁLIDO" : "EXPIRADO"} | ...${t.token.slice(-8)}`);
  }

  const logs = await prisma.emailLog.findMany({
    where: { recipient: { contains: email, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  console.log(`\nE-MAILS registrados (${logs.length}):`);
  for (const l of logs) {
    console.log(`  ${l.createdAt.toLocaleString("pt-BR")} | ${l.status} | ${l.kind} | ${l.providerId ?? "—"}${l.error ? ` | ERRO: ${l.error}` : ""}`);
  }

  const prefixo = email.split("@")[0].slice(0, 6);
  const parecidas = await prisma.user.findMany({
    where: { email: { contains: prefixo, mode: "insensitive" } },
    select: { email: true, name: true, createdAt: true, passwordHash: true },
  });
  console.log(`\nCONTAS com e-mail parecido (${parecidas.length}):`);
  for (const u of parecidas) {
    console.log(`  ${u.name} <${u.email}> — criada ${u.createdAt.toLocaleString("pt-BR")} | senha: ${u.passwordHash ? "SIM" : "NÃO"}`);
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
