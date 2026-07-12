import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decryptApiKey } from "@/lib/crypto";

async function requireAdmin(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  return null;
}

const schema = z.object({ provider: z.enum(["ANTHROPIC", "OPENAI", "GOOGLE"]) });

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "provider inválido" }, { status: 400 });

  const config = await prisma.aIProviderConfig.findUnique({ where: { provider: parsed.data.provider } });
  if (!config?.apiKeyEncrypted) {
    return NextResponse.json({ error: "Nenhuma chave configurada para este provedor" }, { status: 400 });
  }

  let apiKey: string;
  try {
    apiKey = decryptApiKey(config.apiKeyEncrypted);
  } catch {
    return NextResponse.json({ error: "Erro ao descriptografar a chave. Reconfigure." }, { status: 500 });
  }

  try {
    switch (config.provider) {
      case "ANTHROPIC": {
        const Anthropic = (await import("@anthropic-ai/sdk")).default;
        const client = new Anthropic({ apiKey });
        const msg = await client.messages.create({
          model: config.model,
          max_tokens: 10,
          messages: [{ role: "user", content: "responda apenas: ok" }],
        });
        const text = msg.content.find((b) => b.type === "text")?.text ?? "";
        return NextResponse.json({ ok: true, response: text.trim() });
      }
      case "OPENAI": {
        const OpenAI = (await import("openai")).default;
        const client = new OpenAI({ apiKey });
        const res = await client.chat.completions.create({
          model: config.model,
          max_tokens: 10,
          messages: [{ role: "user", content: "responda apenas: ok" }],
        });
        return NextResponse.json({ ok: true, response: res.choices[0]?.message.content?.trim() });
      }
      case "GOOGLE": {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: config.model });
        const result = await model.generateContent("responda apenas: ok");
        return NextResponse.json({ ok: true, response: result.response.text().trim() });
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
