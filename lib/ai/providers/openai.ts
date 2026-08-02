import OpenAI from "openai";
import type { AIFlashcardProvider, FlashcardPair, GenerateOptions } from "../flashcard-generator";
import { SYSTEM_PROMPT, montarPrompt, tokensDeSaida } from "../flashcard-prompt";

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
      max_tokens: tokensDeSaida(count),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `${montarPrompt(fileContent, count)}\n\nDevolva no formato {"flashcards": [{ "front": "...", "back": "..." }]}.`,
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
