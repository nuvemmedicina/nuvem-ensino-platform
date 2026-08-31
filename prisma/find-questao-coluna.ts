/**
 * Localiza a questão de associação de colunas (Diagnóstico positivo / Sinais de
 * alarme / Modelo biopsicossocial / Investigação complementar) no banco de
 * provas do DICI, para conferir antes de remover. Só leitura.
 *
 *   npx tsx prisma/find-questao-coluna.ts
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const questions = await prisma.moduleQuizQuestion.findMany({
    where: { text: { contains: "Diagnóstico positivo" } },
    include: {
      options: { orderBy: { order: "asc" } },
      quiz: { include: { module: { select: { title: true, order: true, course: { select: { slug: true } } } } } },
    },
  });

  console.log(`Encontradas: ${questions.length}\n`);
  for (const q of questions) {
    console.log(`id: ${q.id}`);
    console.log(`curso: ${q.quiz.module.course.slug}  módulo: ${q.quiz.module.order} - ${q.quiz.module.title}`);
    console.log(`sourceRef: ${q.sourceRef}`);
    console.log(`texto: ${q.text}`);
    for (const o of q.options) {
      console.log(`  [${o.isCorrect ? "X" : " "}] ${o.text}`);
    }
    console.log("");
  }
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
