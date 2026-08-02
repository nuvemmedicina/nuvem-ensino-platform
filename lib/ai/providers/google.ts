import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIFlashcardProvider, FlashcardPair, GenerateOptions } from "../flashcard-generator";
import { SYSTEM_PROMPT, montarPrompt, tokensDeSaida } from "../flashcard-prompt";

export class GoogleProvider implements AIFlashcardProvider {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model = "gemini-2.5-flash") {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async generateFlashcards(fileContent: string, options: GenerateOptions): Promise<FlashcardPair[]> {
    const count = options.count ?? 10;
    const genModel = this.genAI.getGenerativeModel({
      model: this.model,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: { maxOutputTokens: tokensDeSaida(count) },
    });

    const result = await genModel.generateContent(montarPrompt(fileContent, count));
    const text = result.response.text();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("Google: resposta não contém JSON válido");
    return JSON.parse(match[0]) as FlashcardPair[];
  }
}
