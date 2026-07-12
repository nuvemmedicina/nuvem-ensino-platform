import OpenAI from "openai";
import type { AIFlashcardProvider, FlashcardPair, GenerateOptions } from "../flashcard-generator";

const SYSTEM_PROMPT = `Você é um especialista em medicina que cria flashcards educacionais.
Gere flashcards de pergunta e resposta claros, em português, com foco em conteúdo médico correto e verificável.
Responda APENAS com um array JSON estrito no formato [{ "front": "...", "back": "..." }], sem nenhum texto fora do JSON.`;

export class OpenAIProvider implements AIFlashcardProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateFlashcards(fileContent: string, options: GenerateOptions): Promise<FlashcardPair[]> {
    const count = options.count ?? 10;
    const response = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Com base no seguinte conteúdo médico, gere exatamente ${count} flashcards no formato JSON {"flashcards": [{...}]}:\n\n${fileContent.slice(0, 60000)}`,
        },
      ],
    });

    const text = response.choices[0]?.message.content ?? "{}";
    const parsed = JSON.parse(text);
    const cards = parsed.flashcards ?? parsed;
    if (!Array.isArray(cards)) throw new Error("OpenAI: resposta não contém array de flashcards");
    return cards as FlashcardPair[];
  }
}
