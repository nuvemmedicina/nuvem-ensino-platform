import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getActiveAIProvider } from "@/lib/ai/flashcard-generator";
import { extractTextFromFile } from "@/lib/file-extraction";

async function requireAdmin(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "INSTRUCTOR")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const countRaw = formData.get("count");
  const count = countRaw ? parseInt(String(countRaw)) : 10;

  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let content: string;
  try {
    content = await extractTextFromFile(buffer, file.type, file.name);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao extrair texto" }, { status: 400 });
  }

  // Imagens: usar visão do Anthropic diretamente
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
      const mediaType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
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
      const flashcards = match ? JSON.parse(match[0]) : [];
      return NextResponse.json({ flashcards });
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
