import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encryptApiKey } from "@/lib/crypto";

const schema = z.object({
  provider: z.enum(["ANTHROPIC", "OPENAI", "GOOGLE"]),
  model: z.string().min(1),
  apiKey: z.string().optional(),
  isActive: z.boolean().optional(),
});

async function requireAdmin(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { provider, model, apiKey, isActive } = parsed.data;

  const existing = await prisma.aIProviderConfig.findUnique({ where: { provider } });

  let apiKeyEncrypted = existing?.apiKeyEncrypted ?? "";
  if (apiKey && apiKey.trim()) {
    apiKeyEncrypted = encryptApiKey(apiKey.trim());
  }
  if (!apiKeyEncrypted) {
    return NextResponse.json({ error: "Informe uma chave de API" }, { status: 400 });
  }

  // Se ativar este provider, desativar os outros
  if (isActive) {
    await prisma.aIProviderConfig.updateMany({ where: { isActive: true }, data: { isActive: false } });
  }

  const config = await prisma.aIProviderConfig.upsert({
    where: { provider },
    create: { provider, model, apiKeyEncrypted, isActive: isActive ?? false },
    update: { model, apiKeyEncrypted, isActive: isActive ?? existing?.isActive ?? false },
  });

  return NextResponse.json({ ok: true, id: config.id, provider: config.provider, isActive: config.isActive });
}

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const configs = await prisma.aIProviderConfig.findMany({ orderBy: { provider: "asc" } });
  return NextResponse.json(
    configs.map((c) => ({ id: c.id, provider: c.provider, model: c.model, isActive: c.isActive, hasKey: !!c.apiKeyEncrypted })),
  );
}
