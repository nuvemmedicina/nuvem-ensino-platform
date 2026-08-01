/**
 * Gera manualmente um link de redefinição de senha para um aluno.
 * Uso quando o e-mail automático não chega — o link pode ser enviado por WhatsApp.
 *
 *   npx tsx prisma/gerar-link-reset.ts email@aluno.com [horas]
 *
 * O token usa o mesmo formato de /api/auth/forgot-password (identifier "reset:<email>"),
 * então é consumido normalmente por /resetar-senha e invalidado após o uso.
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";
import crypto from "node:crypto";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const hours = Number(process.argv[3] ?? 24);

  if (!email) {
    console.error("Informe o e-mail: npx tsx prisma/gerar-link-reset.ts email@aluno.com [horas]");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, passwordHash: true },
  });

  if (!user) {
    console.error(`Nenhum usuário com o e-mail ${email}.`);
    process.exit(1);
  }

  const identifier = `reset:${user.email}`;
  await prisma.verificationToken.deleteMany({ where: { identifier } });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + hours * 60 * 60 * 1000);
  await prisma.verificationToken.create({ data: { identifier, token, expires } });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.nuvemensino.com.br").replace(/\/$/, "");

  console.log(`Aluno:   ${user.name ?? "(sem nome)"} <${user.email}>`);
  console.log(`Senha:   ${user.passwordHash ? "já tem senha definida" : "ainda não definiu senha"}`);
  console.log(`Expira:  ${expires.toLocaleString("pt-BR")} (${hours}h)`);
  console.log(`\n${appUrl}/resetar-senha?token=${token}\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
