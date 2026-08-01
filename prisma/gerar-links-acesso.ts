/**
 * Gera links de primeiro acesso para todos os alunos que estão presos:
 * têm matrícula, mas não têm senha definida nem login social — ou seja,
 * não conseguem entrar de jeito nenhum.
 *
 *   npx tsx prisma/gerar-links-acesso.ts [dias] [saida.csv]
 *
 * Reaproveita token ainda válido quando existe, para não invalidar um link
 * que já tenha sido enviado ao aluno.
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";
import crypto from "node:crypto";
import { writeFileSync } from "node:fs";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.nuvemensino.com.br").replace(/\/$/, "");

function toWhatsApp(raw: string | null): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

async function main() {
  const dias = Number(process.argv[2] ?? 7);
  const saida = process.argv[3] ?? "links-acesso.csv";

  const users = await prisma.user.findMany({
    where: {
      passwordHash: null,
      accounts: { none: {} },
      enrollments: { some: { status: { not: "CANCELLED" } } },
    },
    select: {
      email: true,
      name: true,
      phone: true,
      createdAt: true,
      enrollments: {
        where: { status: { not: "CANCELLED" } },
        select: { course: { select: { title: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const agora = new Date();
  const expires = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
  const linhas: string[][] = [];

  for (const u of users) {
    const identifier = `reset:${u.email}`;

    // Se já existe um link válido para este aluno, mantém — pode já ter sido enviado.
    const existente = await prisma.verificationToken.findFirst({
      where: { identifier, expires: { gt: agora } },
      orderBy: { expires: "desc" },
    });

    let token: string;
    let validade: Date;

    if (existente) {
      token = existente.token;
      validade = existente.expires;
    } else {
      await prisma.verificationToken.deleteMany({ where: { identifier } });
      token = crypto.randomBytes(32).toString("hex");
      validade = expires;
      await prisma.verificationToken.create({ data: { identifier, token, expires: validade } });
    }

    linhas.push([
      (u.name ?? "").replace(/\s+/g, " ").trim(),
      toWhatsApp(u.phone),
      u.email ?? "",
      u.enrollments.map((e) => e.course.title).join(" | "),
      `${APP_URL}/resetar-senha?token=${token}`,
      validade.toLocaleString("pt-BR"),
      existente ? "reaproveitado" : "novo",
    ]);
  }

  const csv = [
    ["Nome", "WhatsApp", "E-mail", "Curso", "Link de acesso", "Expira em", "Token"].join(","),
    ...linhas.map((l) => l.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  writeFileSync(saida, csv, "utf8");

  console.log(`Alunos sem forma de acesso: ${linhas.length}`);
  console.log(`  com WhatsApp: ${linhas.filter((l) => l[1]).length}`);
  console.log(`  links novos: ${linhas.filter((l) => l[6] === "novo").length} | reaproveitados: ${linhas.filter((l) => l[6] === "reaproveitado").length}`);
  console.log(`  validade: ${dias} dia(s)`);
  console.log(`\nArquivo: ${saida}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
