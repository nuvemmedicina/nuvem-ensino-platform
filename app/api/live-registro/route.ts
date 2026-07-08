import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });

  const { nome, especialidade, telefone, email } = body as Record<string, string>;
  if (!nome?.trim() || !especialidade?.trim() || !telefone?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 422 });
  }

  await prisma.liveLead.create({
    data: {
      eventSlug: "dici-live-julho-2026",
      nome: nome.trim(),
      especialidade: especialidade.trim(),
      telefone: telefone.trim(),
      email: email.trim().toLowerCase(),
    },
  });

  return NextResponse.json({ ok: true });
}
