import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getActiveAIProvider } from "@/lib/ai/flashcard-generator";
import { extractTextFromFile } from "@/lib/file-extraction";
import { z } from "zod";

async function requireAdmin(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "INSTRUCTOR")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  return null;
}

const schema = z.object({
  blobUrl: z.string().url(),
  filename: z.string(),
  mimeType: z.string(),
  count: z.number().int().min(1).max(50).default(10),
});

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { blobUrl, filename, mimeType, count } = parsed.data;

  // Download the file from Vercel Blob
  let buffer: Buffer;
  try {
    const res = await fetch(blobUrl);
    if (!res.ok) throw new Error(`Falha ao baixar arquivo: ${res.status}`);
    buffer = Buffer.from(await res.arrayBuffer());
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao baixar arquivo" }, { status: 400 });
  }

  // Extract text
  let content: string;
  try {
    content = await extractTextFromFile(buffer, mimeType, filename);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao extrair texto" }, { status: 400 });
  }

  // Images: use Anthropic vision directly
  if (content === "__IMAGE_BINARY__") {
    try {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const { prisma } = await import("@/lib/prisma");
      const { decryptApiKey } = await import("@/lib/crypto");
      const cfg = await prisma.aIProviderConfig.findFirst({ where: { provider: "ANTHROPIC", isActive: true } });
      if (!cfg) throw new Error("Configure o Anthropic como provedor ativo para processar imagens");
      const apiKey = decryptApiKey(cfg.apiKeyEncrypted);
      const client = new Anthropic({ apiKey });
      const base64 = buffer.toString("base64");
      const mediaType = mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
      const msg = await client.messages.create({
        model: cfg.model,
        max_tokens: 4096,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: `Gere exatamente ${count} flashcards médicos baseados nesta imagem. Responda APENAS com JSON: [{ "front": "...", "back": "..." }]` },
          ],
        }],
      });
      const text = msg.content.find((b) => b.type === "text")?.text ?? "[]";
      const match = text.match(/\[[\s\S]*\]/);
      return NextResponse.json({ flashcards: match ? JSON.parse(match[0]) : [] });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao processar imagem" }, { status: 500 });
    }
  }

  try {
    const provider = await getActiveAIProvider();
    const flashcards = await provider.generateFlashcards(content, { count });
    return NextResponse.json({ flashcards });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro na geração" }, { status: 500 });
  }
}

export const maxDuration = 60;
