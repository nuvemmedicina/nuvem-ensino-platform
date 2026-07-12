import { prisma } from "@/lib/prisma";
import { AIConfigClient } from "./AIConfigClient";

export const dynamic = "force-dynamic";

const MODELS: Record<string, string[]> = {
  ANTHROPIC: ["claude-sonnet-4-6", "claude-opus-4-8", "claude-haiku-4-5-20251001"],
  OPENAI: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
  GOOGLE: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash"],
};

export default async function AIConfigPage() {
  const configs = await prisma.aIProviderConfig.findMany();
  const configMap = Object.fromEntries(configs.map((c) => [c.provider, { model: c.model, isActive: c.isActive, hasKey: !!c.apiKeyEncrypted }]));

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-light text-foreground">Configurações de IA</h1>
        <p className="font-sans text-sm text-muted mt-1">Configure os provedores de inteligência artificial para geração de flashcards.</p>
      </div>
      <AIConfigClient configs={configMap} models={MODELS} />
    </div>
  );
}
