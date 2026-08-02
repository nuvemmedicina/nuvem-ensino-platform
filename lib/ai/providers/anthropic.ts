import Anthropic from "@anthropic-ai/sdk";
import type { AIFlashcardProvider, FlashcardPair, GenerateOptions } from "../flashcard-generator";
import { SYSTEM_PROMPT, montarPrompt, tokensDeSaida } from "../flashcard-prompt";

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
      max_tokens: tokensDeSaida(count),
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: montarPrompt(fileContent, count) }],
    });

    const text = message.content.find((b) => b.type === "text")?.text ?? "[]";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("Anthropic: resposta não contém JSON válido");
    return JSON.parse(match[0]) as FlashcardPair[];
  }
}
