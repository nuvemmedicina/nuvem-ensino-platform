import { prisma } from "@/lib/prisma";
import { decryptApiKey } from "@/lib/crypto";

export interface FlashcardPair {
  front: string;
  back: string;
}

export interface GenerateOptions {
  count?: number;
}

export interface AIFlashcardProvider {
  generateFlashcards(fileContent: string, options: GenerateOptions): Promise<FlashcardPair[]>;
}

export async function getActiveAIProvider(): Promise<AIFlashcardProvider> {
  const config = await prisma.aIProviderConfig.findFirst({ where: { isActive: true } });
  if (!config) throw new Error("Nenhum provedor de IA configurado e ativo. Configure em Admin > Configurações > IA.");

  const apiKey = decryptApiKey(config.apiKeyEncrypted);

  switch (config.provider) {
    case "ANTHROPIC": {
      const { AnthropicProvider } = await import("./providers/anthropic");
      return new AnthropicProvider(apiKey, config.model);
    }
    case "OPENAI": {
      const { OpenAIProvider } = await import("./providers/openai");
      return new OpenAIProvider(apiKey, config.model);
    }
    case "GOOGLE": {
      const { GoogleProvider } = await import("./providers/google");
      return new GoogleProvider(apiKey, config.model);
    }
    default:
      throw new Error(`Provedor desconhecido: ${config.provider}`);
  }
}
