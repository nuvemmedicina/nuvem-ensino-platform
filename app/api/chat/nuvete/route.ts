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

  // Monta contexto de estudo
  const studyContext = [
    context?.courseTitle && `Curso atual: ${context.courseTitle}`,
    context?.moduleTitle && `Módulo: ${context.moduleTitle}`,
    context?.lessonTitle && `Aula: ${context.lessonTitle}`,
  ].filter(Boolean).join(" | ");

  const systemPrompt = `Você é a Nuvete, assistente de estudos da NU.V.E.M ENSINO — plataforma de formação médica de excelência.

Sua missão é ajudar ${userName} a estudar e compreender o conteúdo médico com clareza, rigor científico e didática.

${studyContext ? `Contexto de estudo: ${studyContext}` : ""}

Diretrizes:
- Responda sempre em português do Brasil
- Use linguagem clara, mas tecnicamente precisa para profissionais de saúde
- Quando explicar conceitos, use exemplos clínicos práticos
- Para diagnósticos e tratamentos, sempre reforce que a decisão clínica é do médico
- Seja encorajadora e motivadora — o aprendizado médico é exigente
- Respostas concisas (3–5 parágrafos no máximo); use listas quando ajudar
- Se não souber algo com certeza, diga que não tem essa informação
- Não invente dados, protocolos ou referências

Você NÃO é um substituto para consulta médica — deixe isso claro se perguntado sobre casos reais de pacientes.`;

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
