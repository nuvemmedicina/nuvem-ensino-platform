/**
 * Estado da base de conhecimento da Nuvete (RAG) e do material que existe
 * para alimentá-la. Só leitura.
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const chunks = await prisma.$queryRaw<Array<{ courseId: string; sourceType: string; n: bigint }>>`
    SELECT "courseId", "sourceType", COUNT(*) as n
    FROM "ContentChunk" GROUP BY "courseId", "sourceType"
  `;
  console.log(`TRECHOS INDEXADOS NA BASE DA NUVETE: ${chunks.reduce((s, c) => s + Number(c.n), 0)}`);
  for (const c of chunks) {
    const curso = await prisma.course.findUnique({ where: { id: c.courseId }, select: { title: true } });
    console.log(`  ${String(c.n).padStart(4)} ${c.sourceType.padEnd(16)} ${curso?.title.slice(0, 45)}`);
  }
  if (!chunks.length) console.log("  (tabela vazia — a Nuvete não tem nenhum material do curso)");

  const cursos = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    select: {
      title: true, description: true,
      modules: { select: { lessons: { select: { description: true, content: true, materials: { select: { fileType: true } } } } } },
    },
  });

  console.log(`\nMATÉRIA-PRIMA DISPONÍVEL PARA INDEXAR (o RAG só lê texto):`);
  for (const c of cursos) {
    const aulas = c.modules.flatMap((m) => m.lessons);
    const comDesc = aulas.filter((l) => l.description && l.description.length > 40).length;
    const comTexto = aulas.filter((l) => l.content && l.content.length > 80).length;
    const mats = aulas.flatMap((l) => l.materials);
    const indexaveis = mats.filter((m) => m.fileType?.includes("pdf") || m.fileType?.includes("text")).length;
    console.log(`  ${c.title.slice(0, 42).padEnd(42)} ${String(aulas.length).padStart(3)} aulas | desc: ${String(comDesc).padStart(3)} | texto: ${String(comTexto).padStart(3)} | materiais PDF/TXT: ${indexaveis}`);
  }

  const cfg = await prisma.aIProviderConfig.findMany({ select: { provider: true, model: true, isActive: true } });
  console.log(`\nPROVEDORES DE IA CONFIGURADOS:`);
  for (const c of cfg) console.log(`  ${c.provider.padEnd(10)} ${c.model.padEnd(34)} ${c.isActive ? "ATIVO" : "inativo"}`);
  if (!cfg.some((c) => c.provider === "OPENAI")) {
    console.log("  !! sem OPENAI — indexar e buscar no RAG dependem dele (embeddings)");
  }
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
