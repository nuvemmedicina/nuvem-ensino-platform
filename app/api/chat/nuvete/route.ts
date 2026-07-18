import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decryptApiKey } from "@/lib/crypto";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
  }

  const { messages, context } = await req.json() as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    context?: { courseTitle?: string; moduleTitle?: string; lessonTitle?: string };
  };

  // Busca configuração ativa da IA
  const cfg = await prisma.aIProviderConfig.findFirst({
    where: { isActive: true },
  });
  if (!cfg) {
    return new Response(JSON.stringify({ error: "IA não configurada. Acesse /admin/configuracoes/ia." }), { status: 503 });
  }

  const apiKey = decryptApiKey(cfg.apiKeyEncrypted);
  const userName = session.user.name?.split(" ")[0] ?? "Aluno";

  // Busca contexto RAG — chunks relevantes à última pergunta do aluno
  let ragContext = "";
  try {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    if (lastUserMsg) {
      const courseId = (context as { courseId?: string } | undefined)?.courseId;
      const ragRes = await fetch(
        `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/admin/rag/search`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", cookie: req.headers.get("cookie") ?? "" },
          body: JSON.stringify({ query: lastUserMsg, courseId, topK: 5 }),
        }
      );
      if (ragRes.ok) {
        const { chunks } = await ragRes.json() as { chunks: string[] };
        if (chunks.length > 0) {
          ragContext = "\n\n---\nTrechos relevantes do material do curso:\n" + chunks.map((c, i) => `[${i + 1}] ${c}`).join("\n\n");
        }
      }
    }
  } catch { /* RAG é opcional — não bloqueia o chat */ }

  // Monta contexto de estudo
  const studyContext = [
    context?.courseTitle && `Curso atual: ${context.courseTitle}`,
    context?.moduleTitle && `Módulo: ${context.moduleTitle}`,
    context?.lessonTitle && `Aula: ${context.lessonTitle}`,
  ].filter(Boolean).join(" | ");

  const systemPrompt = `Você é a Nuvete, assistente de estudos da NU.V.E.M ENSINO — plataforma de formação médica de excelência.

Sua missão é ajudar ${userName} a estudar e compreender o conteúdo médico com clareza, rigor científico e didática.

${studyContext ? `Contexto de estudo: ${studyContext}` : ""}${ragContext}

FORMATAÇÃO — siga rigorosamente:
- NUNCA use markdown: sem #, ##, *negrito*, _itálico_, ---, ===
- NUNCA use travessões (—) decorativos ou separadores
- Escreva em parágrafos curtos e diretos, linguagem conversacional
- Para listas, use emojis como marcadores: 🔹 🔸 ✅ ⚠️ 💡 🫀 🧠 🫁
- Para títulos de seção dentro da resposta, use apenas um emoji + texto simples (ex: "🧠 O que é")
- Máximo 4 seções por resposta; cada seção com 2–3 frases
- Se for dar um exemplo clínico, inicie com "💡 Exemplo:"
- Termine respostas longas com "📌 Resumindo:" + 1 frase

CONTEÚDO:
- Português do Brasil, linguagem clara e tecnicamente precisa
- Exemplos clínicos práticos sempre que possível
- Reforce que decisões clínicas são do médico quando pertinente
- Seja encorajadora — o aprendizado médico é exigente
- Se não souber, diga que não tem essa informação; não invente

Você NÃO substitui consulta médica — deixe isso claro se perguntada sobre casos reais de pacientes.`;

  if (cfg.provider === "ANTHROPIC") {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    const stream = await client.messages.stream({
      model: cfg.model,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
    });
  }

  // OpenAI fallback
  if (cfg.provider === "OPENAI") {
    const { OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });

    const stream = await client.chat.completions.create({
      model: cfg.model,
      max_tokens: 1024,
      stream: true,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(JSON.stringify({ error: "Provedor de IA não suportado" }), { status: 400 });
}
