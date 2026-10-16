import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/appUrl";
import { sendAulaGratuita } from "@/lib/email";
import { sendAfterResponse } from "@/lib/emailBackground";
import {
  AULA_GRATUITA,
  AULA_GRATUITA_COOKIE,
  linkMatriculaAulaGratuita,
  precosAulaGratuita,
} from "@/lib/aula-gratuita";

const EMAIL_VALIDO = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/** Inscrição na aula gratuita: grava o interessado e libera o vídeo neste navegador. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });

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

  // Quem se inscreve de novo (outro aparelho, cookie apagado) reaproveita a
  // inscrição: atualiza os dados em vez de duplicar a pessoa na lista.
  const existente = await prisma.liveLead.findFirst({
    where: { eventSlug: AULA_GRATUITA.eventSlug, email: dados.email },
    select: { id: true },
  });

  const lead = existente
    ? await prisma.liveLead.update({
        where: { id: existente.id },
        data: { ...dados, aceitaComunicacoes: aceitaComunicacoes === true, ultimoAcesso: new Date() },
        select: { id: true },
      })
    : await prisma.liveLead.create({
        data: {
          ...dados,
          eventSlug: AULA_GRATUITA.eventSlug,
          aceitaComunicacoes: aceitaComunicacoes === true,
          origem: texto(origem).slice(0, 100) || null,
          ultimoAcesso: new Date(),
        },
        select: { id: true },
      });

  if (!existente) {
    const curso = await prisma.course.findUnique({
      where: { slug: AULA_GRATUITA.courseSlug },
      select: { price: true },
    });
    const { precoDe, precoPor } = precosAulaGratuita(Number(curso?.price ?? 0));
    sendAfterResponse("aula gratuita", dados.email, () =>
      sendAulaGratuita({
        to: dados.email,
        nome: dados.nome,
        titulo: AULA_GRATUITA.titulo,
        linkAula: `${APP_URL}/aula-gratuita?acesso=${lead.id}`,
        linkMatricula: linkMatriculaAulaGratuita(APP_URL),
        cupom: AULA_GRATUITA.cupom,
        descontoPct: AULA_GRATUITA.descontoPct,
        precoDe,
        precoPor,
      }),
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AULA_GRATUITA_COOKIE, lead.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
