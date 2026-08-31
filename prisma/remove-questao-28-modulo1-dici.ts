/**
 * Remove a questão 28 do bloco 1 (prova do Módulo I) do curso DICI — a Dra.
 * Vera identificou que o gabarito do arquivo original (1–1, 2–2, 3–3, 4–4)
 * está errado; a sequência correta seria 3–1–2–4, que não é nenhuma das
 * alternativas cadastradas. Pediu para retirar a questão em vez de corrigir
 * o gabarito.
 *
 *   npx tsx prisma/remove-questao-28-modulo1-dici.ts
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const QUESTION_ID = "cms6rzhxi003sa88n7ewrb2pd";

async function main() {
  const q = await prisma.moduleQuizQuestion.findUnique({
    where: { id: QUESTION_ID },
    select: { id: true, sourceRef: true, text: true },
  });
  if (!q) throw new Error("Questão não encontrada — já foi removida?");
  if (q.sourceRef !== "Banco Dra. Vera · bloco 1 · questão 28") {
    throw new Error(`sourceRef inesperado: ${q.sourceRef}`);
  }

  await prisma.moduleQuizQuestion.delete({ where: { id: QUESTION_ID } });
  console.log(`Removida: ${q.sourceRef}`);
  console.log(q.text);
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
