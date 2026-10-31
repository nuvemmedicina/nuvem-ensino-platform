import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LIVE_DICI, liveDiciEncerrada } from "@/lib/live-dici";

const EMAIL_VALIDO = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/** Inscrição na live do DICI (/live). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });

  if (liveDiciEncerrada()) {
    return NextResponse.json({ error: "As inscrições para esta live estão encerradas." }, { status: 410 });
  }

  const { nome, especialidade, telefone, email, aceitaComunicacoes, origem } = body as Record<string, unknown>;
  const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const dados = {
    nome: texto(nome),
    especialidade: texto(especialidade),
    telefone: texto(telefone),
    email: texto(email).toLowerCase(),
  };
  if (!dados.nome || !dados.especialidade || !dados.telefone || !dados.email) {
    return NextResponse.json({ error: "Preencha todos os campos." }, { status: 422 });
  }
  if (!EMAIL_VALIDO.test(dados.email)) {
    return NextResponse.json({ error: "Confira o e-mail informado." }, { status: 422 });
  }
  if (dados.telefone.replace(/\D/g, "").length < 10) {
    return NextResponse.json({ error: "Confira o WhatsApp informado (com DDD)." }, { status: 422 });
  }

  // Quem se inscreve de novo atualiza os dados em vez de duplicar a pessoa na lista.
  const existente = await prisma.liveLead.findFirst({
    where: { eventSlug: LIVE_DICI.eventSlug, email: dados.email },
    select: { id: true },
  });

  if (existente) {
    await prisma.liveLead.update({
      where: { id: existente.id },
      data: { ...dados, aceitaComunicacoes: aceitaComunicacoes === true },
    });
  } else {
    await prisma.liveLead.create({
      data: {
        ...dados,
        eventSlug: LIVE_DICI.eventSlug,
        aceitaComunicacoes: aceitaComunicacoes === true,
        origem: texto(origem).slice(0, 100) || null,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
