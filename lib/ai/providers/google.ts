import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIFlashcardProvider, FlashcardPair, GenerateOptions } from "../flashcard-generator";

const SYSTEM_PROMPT = `Você é um especialista em medicina que cria flashcards educacionais.
Gere flashcards de pergunta e resposta claros, em português, com foco em conteúdo médico correto e verificável.
Responda APENAS com um array JSON estrito no formato [{ "front": "...", "back": "..." }], sem nenhum texto fora do JSON.`;

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
    });

    const result = await genModel.generateContent(
      `Com base no seguinte conteúdo médico, gere exatamente ${count} flashcards no formato JSON solicitado:\n\n${fileContent.slice(0, 60000)}`,
    );
    const text = result.response.text();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("Google: resposta não contém JSON válido");
    return JSON.parse(match[0]) as FlashcardPair[];
  }
}
