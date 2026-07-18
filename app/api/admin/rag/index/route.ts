import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300;

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return !session?.user?.id || role !== "ADMIN";
}

function chunkText(text: string, maxChars = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    chunks.push(text.slice(start, end).trim());
    start += maxChars - overlap;
  }
  return chunks.filter((c) => c.length > 50);
}

async function embedTexts(texts: string[], apiKey: string): Promise<number[][]> {
  const { OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey });
  const res = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}

export async function POST(req: NextRequest) {
  if (await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { courseId } = await req.json() as { courseId: string };
  if (!courseId) return NextResponse.json({ error: "courseId obrigatório" }, { status: 400 });

  // Busca config OpenAI para embeddings
  const cfg = await prisma.aIProviderConfig.findFirst({ where: { provider: "OPENAI" } });
  if (!cfg) return NextResponse.json({ error: "Configure o provedor OpenAI nas configurações de IA para usar RAG." }, { status: 503 });

  const { decryptApiKey } = await import("@/lib/crypto");
  const apiKey = decryptApiKey(cfg.apiKeyEncrypted);

  // Busca todo o conteúdo do curso
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      description: true,
      modules: {
        select: {
          id: true,
          title: true,
          lessons: {
            select: {
              id: true,
              title: true,
              description: true,
              content: true,
              materials: { select: { id: true, title: true, fileUrl: true, fileType: true } },
            },
          },
        },
      },
    },
  });
  if (!course) return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });

  // Remove chunks antigos do curso
  await prisma.$executeRaw`DELETE FROM "ContentChunk" WHERE "courseId" = ${courseId}`;

  const toInsert: Array<{
    courseId: string; moduleId: string | null; lessonId: string | null;
    sourceType: string; sourceId: string; chunkIndex: number; text: string; embedding: number[];
  }> = [];

  // Coleta textos para indexar
  const textSources: Array<{
    text: string; courseId: string; moduleId: string | null;
    lessonId: string | null; sourceType: string; sourceId: string;
  }> = [];

  // Descrição do curso
  if (course.description) {
    textSources.push({
      text: `Curso: ${course.title}\n\n${course.description}`,
      courseId, moduleId: null, lessonId: null,
      sourceType: "description", sourceId: courseId,
    });
  }

  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      // Conteúdo textual da aula
      const parts = [
        `Módulo: ${mod.title}`,
        `Aula: ${lesson.title}`,
        lesson.description ?? "",
        lesson.content ?? "",
      ].filter(Boolean).join("\n\n");

      if (parts.length > 80) {
        textSources.push({
          text: parts, courseId, moduleId: mod.id, lessonId: lesson.id,
          sourceType: "lesson_content", sourceId: lesson.id,
        });
      }

      // Materiais PDF/TXT — baixa e extrai texto
      for (const mat of lesson.materials) {
        const isText = mat.fileType?.includes("text") || mat.fileUrl?.endsWith(".txt");
        const isPdf = mat.fileType?.includes("pdf") || mat.fileUrl?.endsWith(".pdf");
        if (!isText && !isPdf) continue;
        try {
          const r = await fetch(mat.fileUrl);
          if (!r.ok) continue;
          const buf = Buffer.from(await r.arrayBuffer());
          const { extractTextFromFile } = await import("@/lib/file-extraction");
          const text = await extractTextFromFile(buf, mat.fileType ?? "application/pdf", mat.title);
          if (text.length > 80) {
            textSources.push({
              text: `Material: ${mat.title}\n\n${text}`,
              courseId, moduleId: mod.id, lessonId: lesson.id,
              sourceType: "material", sourceId: mat.id,
            });
          }
        } catch { /* ignora erros de extração */ }
      }
    }
  }

  // Chunkeia e gera embeddings em lotes de 20
  const allChunks: typeof textSources[0][] = [];
  const allTexts: string[] = [];

  for (const src of textSources) {
    const chunks = chunkText(src.text);
    for (const chunk of chunks) {
      allChunks.push(src);
      allTexts.push(chunk);
    }
  }

  const BATCH = 20;
  for (let i = 0; i < allTexts.length; i += BATCH) {
    const batchTexts = allTexts.slice(i, i + BATCH);
    const embeddings = await embedTexts(batchTexts, apiKey);

    for (let j = 0; j < batchTexts.length; j++) {
      const src = allChunks[i + j];
      toInsert.push({
        courseId: src.courseId,
        moduleId: src.moduleId,
        lessonId: src.lessonId,
        sourceType: src.sourceType,
        sourceId: src.sourceId,
        chunkIndex: i + j,
        text: batchTexts[j],
        embedding: embeddings[j],
      });
    }
  }

  // Insere com embedding como vetor pgvector
  for (const chunk of toInsert) {
    const vecStr = `[${chunk.embedding.join(",")}]`;
    await prisma.$executeRaw`
      INSERT INTO "ContentChunk" ("id","courseId","moduleId","lessonId","sourceType","sourceId","chunkIndex","text","embedding","createdAt")
      VALUES (
        gen_random_uuid()::text,
        ${chunk.courseId}, ${chunk.moduleId}, ${chunk.lessonId},
        ${chunk.sourceType}, ${chunk.sourceId}, ${chunk.chunkIndex},
        ${chunk.text}, ${vecStr}::vector, NOW()
      )
    `;
  }

  return NextResponse.json({ indexed: toInsert.length, sources: textSources.length });
}

export async function GET(req: NextRequest) {
  if (await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const courseId = req.nextUrl.searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "courseId obrigatório" }, { status: 400 });
  const count = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM "ContentChunk" WHERE "courseId" = ${courseId}
  `;
  return NextResponse.json({ chunks: Number(count[0].count) });
}
