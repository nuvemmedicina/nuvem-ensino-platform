import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decryptApiKey } from "@/lib/crypto";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { query, courseId, topK = 5 } = await req.json() as {
    query: string; courseId?: string; topK?: number;
  };

  const cfg = await prisma.aIProviderConfig.findFirst({ where: { provider: "OPENAI" } });
  if (!cfg) return NextResponse.json({ chunks: [] });

  const apiKey = decryptApiKey(cfg.apiKeyEncrypted);
  const { OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey });

  const res = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });
  const queryVec = res.data[0].embedding;
  const vecStr = `[${queryVec.join(",")}]`;

  let rows: Array<{ text: string; sourceType: string; lessonId: string | null }>;

  if (courseId) {
    rows = await prisma.$queryRaw`
      SELECT text, "sourceType", "lessonId"
      FROM "ContentChunk"
      WHERE "courseId" = ${courseId}
      ORDER BY embedding <=> ${vecStr}::vector
      LIMIT ${topK}
    `;
  } else {
    rows = await prisma.$queryRaw`
      SELECT text, "sourceType", "lessonId"
      FROM "ContentChunk"
      ORDER BY embedding <=> ${vecStr}::vector
      LIMIT ${topK}
    `;
  }

  return NextResponse.json({ chunks: rows.map((r) => r.text) });
}
