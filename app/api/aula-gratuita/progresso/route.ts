import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AULA_GRATUITA } from "@/lib/aula-gratuita";

/**
 * Registra até onde a pessoa assistiu à aula gratuita. Só sobe: voltar o
 * vídeo para rever um trecho não apaga o que ela já tinha assistido.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const pct = Math.max(0, Math.min(100, Math.round(Number(body?.pct))));
  if (!id || !Number.isFinite(pct)) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  await prisma.liveLead.updateMany({
    where: { id, eventSlug: AULA_GRATUITA.eventSlug, assistiuPct: { lt: pct } },
    data: { assistiuPct: pct, ultimoAcesso: new Date() },
  });

  return NextResponse.json({ ok: true });
}
