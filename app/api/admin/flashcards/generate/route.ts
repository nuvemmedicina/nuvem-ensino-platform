import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getActiveAIProvider } from "@/lib/ai/flashcard-generator";
import { extractTextFromFile } from "@/lib/file-extraction";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return !session?.user?.id || (role !== "ADMIN" && role !== "INSTRUCTOR");
}

export async function POST(req: NextRequest) {
  if (await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const count = Math.min(50, Math.max(1, Number(form.get("count") ?? "10")));

  if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: "Arquivo muito grande (máx 50 MB)" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type;
  const filename = file.name;

  // Imagens: visão direta via Anthropic
  if (mimeType.startsWith("image/")) {
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
            { type: "text", text: `Gere exatamente ${count} flashcards médicos baseados nesta imagem. Responda APENAS com JSON válido: [{ "front": "...", "back": "..." }]` },
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

  // PDF / DOCX / TXT: extrai texto e gera via provedor ativo
  let content: string;
  try {
    content = await extractTextFromFile(buffer, mimeType, filename);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao extrair texto do arquivo" }, { status: 400 });
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
