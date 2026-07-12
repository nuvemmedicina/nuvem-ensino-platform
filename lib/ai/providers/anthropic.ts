import Anthropic from "@anthropic-ai/sdk";
import type { AIFlashcardProvider, FlashcardPair, GenerateOptions } from "../flashcard-generator";

const SYSTEM_PROMPT = `Você é um especialista em medicina que cria flashcards educacionais.
Gere flashcards de pergunta e resposta claros, em português, com foco em conteúdo médico correto e verificável.
Responda APENAS com um array JSON estrito no formato [{ "front": "...", "back": "..." }], sem nenhum texto fora do JSON.`;

export class AnthropicProvider implements AIFlashcardProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model = "claude-sonnet-4-6") {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async generateFlashcards(fileContent: string, options: GenerateOptions): Promise<FlashcardPair[]> {
    const count = options.count ?? 10;
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Com base no seguinte conteúdo médico, gere exatamente ${count} flashcards no formato JSON solicitado:\n\n${fileContent.slice(0, 60000)}`,
        },
      ],
    });

    const text = message.content.find((b) => b.type === "text")?.text ?? "[]";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("Anthropic: resposta não contém JSON válido");
    return JSON.parse(match[0]) as FlashcardPair[];
  }
}
