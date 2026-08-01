import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";
import { writeFileSync } from "node:fs";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Normaliza o telefone para o formato de link do WhatsApp (55 + DDD + número).
function toWhatsApp(raw: string | null): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

async function main() {
  const enrollments = await prisma.enrollment.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true } },
      course: { select: { title: true, slug: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const rows = enrollments.map((e) => ({
    curso: e.course.title,
    slug: e.course.slug,
    nome: e.user.name ?? "",
    telefone: e.user.phone ?? "",
    whatsapp: toWhatsApp(e.user.phone),
    email: e.user.email ?? "",
    status: e.status,
    data: e.enrolledAt.toISOString().slice(0, 10),
  }));

  // Resumo por curso no console
  const porCurso = new Map<string, number>();
  for (const r of rows) porCurso.set(r.curso, (porCurso.get(r.curso) ?? 0) + 1);
  console.log(`Total de matrículas: ${rows.length}\n`);
  for (const [curso, n] of [...porCurso].sort((a, b) => b[1] - a[1])) {
    console.log(`${n.toString().padStart(4)}  ${curso}`);
  }
  console.log(`\nSem telefone cadastrado: ${rows.filter((r) => !r.whatsapp).length}`);

  const csv = [
    "curso,nome,telefone,whatsapp,email,status,data",
    ...rows.map((r) =>
      [r.curso, r.nome, r.telefone, r.whatsapp, r.email, r.status, r.data]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    ),
  ].join("\n");

  const out = process.argv[2] ?? "inscritos.csv";
  writeFileSync(out, "﻿" + csv, "utf8");
  console.log(`\nArquivo gerado: ${out}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
