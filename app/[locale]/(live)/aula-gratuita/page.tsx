import Image from "next/image";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  AULA_GRATUITA,
  AULA_GRATUITA_COOKIE,
  linkMatriculaAulaGratuita,
  precosAulaGratuita,
} from "@/lib/aula-gratuita";
import AulaGratuitaForm from "./AulaGratuitaForm";
import AulaGratuitaPlayer from "./AulaGratuitaPlayer";

const descricao =
  `A NUVEM Medicina completa 5 anos e libera uma aula exclusiva: O Médico Ampliado — aplicações práticas da IA na rotina do gastroenterologista, com a Dra. Vera Ângelo e o ${AULA_GRATUITA.convidado}.`;
const tituloPagina = `Aula gratuita: ${AULA_GRATUITA.titulo} · NU.V.E.M ENSINO`;
// O openGraph da página substitui o do layout inteiro, por isso repete tudo.
const capaOg = { url: AULA_GRATUITA.capa, width: 1920, height: 1080, alt: `Dra. Vera Ângelo e ${AULA_GRATUITA.convidado}` };

export const metadata: Metadata = {
  // O layout já acrescenta " | NU.V.E.M ENSINO" ao título da aba.
  title: `Aula gratuita: ${AULA_GRATUITA.titulo}`,
  description: descricao,
  alternates: { canonical: "/aula-gratuita" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/aula-gratuita",
    siteName: "NU.V.E.M ENSINO",
    title: tituloPagina,
    description: descricao,
    images: [capaOg],
  },
  twitter: { card: "summary_large_image", title: tituloPagina, description: descricao, images: [capaOg.url] },
};

type Props = { searchParams: Promise<{ acesso?: string }> };

export default async function AulaGratuitaPage({ searchParams }: Props) {
  const { acesso } = await searchParams;
  const cookieStore = await cookies();
  // O link do e-mail (?acesso=) vale em qualquer aparelho; o cookie, neste navegador.
  const leadId = acesso || cookieStore.get(AULA_GRATUITA_COOKIE)?.value;

  const [lead, curso] = await Promise.all([
    leadId
      ? prisma.liveLead.findFirst({
          where: { id: leadId, eventSlug: AULA_GRATUITA.eventSlug },
          select: { id: true, nome: true },
        })
      : null,
    prisma.course.findUnique({
      where: { slug: AULA_GRATUITA.courseSlug },
      select: { price: true },
    }),
  ]);
  if (!curso) notFound();

  const { precoDe, precoPor } = precosAulaGratuita(Number(curso.price));

  if (lead) {
    return (
      <AulaLiberada
        leadId={lead.id}
        nome={lead.nome}
        precoDe={precoDe}
        precoPor={precoPor}
      />
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ── Painel da foto ── */}
      <div className="relative bg-[#001820] flex flex-col px-6 py-6 sm:px-8 lg:h-screen lg:sticky lg:top-0 lg:px-12 lg:py-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/nuvem-ensino-branca.png" alt="NU.V.E.M ENSINO" className="h-10 w-auto self-start lg:h-11" />

        <div className="flex-1 flex flex-col justify-center py-6 lg:py-10">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.45)]">
            <Image
              src={AULA_GRATUITA.capa}
              alt={`Dra. Vera Ângelo e ${AULA_GRATUITA.convidado}`}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h2 className="text-white text-lg sm:text-xl font-normal leading-snug" style={{ fontFamily: "Georgia, serif" }}>
                Dra. Vera Ângelo
              </h2>
              <p className="text-white/55 text-xs sm:text-sm mt-1 leading-relaxed">
                Neurogastroenterologia e Motilidade Digestiva
              </p>
            </div>
            <div>
              <h2 className="text-white text-lg sm:text-xl font-normal leading-snug" style={{ fontFamily: "Georgia, serif" }}>
                {AULA_GRATUITA.convidado}
              </h2>
              <p className="text-white/55 text-xs sm:text-sm mt-1 leading-relaxed">
                Convidado · {AULA_GRATUITA.convidadoCargo}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Painel do formulário ── */}
      <div className="bg-white flex flex-col justify-center px-6 py-12 sm:px-8 lg:px-16 lg:py-20">
        <div className="inline-flex items-center gap-2 bg-[#00475E] text-white text-[10px] font-black tracking-[0.18em] uppercase px-3.5 py-1.5 rounded-full w-fit mb-7">
          Aula gratuita · gravação completa · {AULA_GRATUITA.duracaoLabel}
        </div>

        <h1
          className="text-[#00475E] leading-[1.15] mb-4"
          style={{ fontFamily: "Georgia, serif", fontSize: "clamp(1.6rem, 3.2vw, 2.4rem)", fontWeight: "normal" }}
        >
          {AULA_GRATUITA.titulo}
        </h1>

        <p className="text-[15px] text-[#0C1E24] leading-relaxed max-w-[52ch] mb-4">
          <strong className="font-semibold text-[#00475E]">A NUVEM Medicina está completando 5 anos! 🎉</strong>{" "}
          E para comemorar essa jornada com nossos alunos, liberamos esta aula exclusiva sobre{" "}
          <em>“O Médico Ampliado: Aplicações Práticas da IA na Rotina do Gastroenterologista”</em>,
          refletindo sobre como a Inteligência Artificial pode atuar como uma ferramenta de resgate da
          humanização e da presença clínica.
        </p>

        <p className="text-sm text-[#5C747A] leading-relaxed max-w-[52ch] mb-6">
          É a gravação completa do {AULA_GRATUITA.encontro} do Curso de Aperfeiçoamento em DICI.
        </p>

        <div className="flex items-start gap-3 bg-[#F5EDD4] border border-[#B8973A] rounded-xl px-4 py-3.5 mb-8">
          <span className="text-xl mt-0.5 shrink-0" aria-hidden>🎁</span>
          <p className="text-sm text-[#0C1E24] leading-relaxed">
            <strong className="text-[#8A6D1E] font-bold">
              Quem assiste ganha {AULA_GRATUITA.descontoPct}% de desconto no curso completo.
            </strong>
            <br />
            O cupom aparece junto com a aula e chega no seu e-mail.
          </p>
        </div>

        <div className="h-px bg-[#D8D2C8] mb-8" />

        <AulaGratuitaForm />

        <div className="mt-10 pt-8 border-t border-[#D8D2C8] flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/selos-iso-mec.png" alt="Certificações ISO 9001 e Reconhecido pelo MEC" className="h-20 w-auto" />
        </div>
      </div>
    </div>
  );
}

function AulaLiberada({
  leadId,
  nome,
  precoDe,
  precoPor,
}: {
  leadId: string;
  nome: string;
  precoDe: string;
  precoPor: string;
}) {
  const primeiroNome = nome.trim().split(/\s+/)[0];

  return (
    <div className="min-h-screen bg-[#001820] text-white">
      <header className="px-6 py-5 sm:px-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/nuvem-ensino-branca.png" alt="NU.V.E.M ENSINO" className="h-10 w-auto" />
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#C9A84C] mb-2">
          {AULA_GRATUITA.encontro} · Curso de Aperfeiçoamento em DICI
        </p>
        <h1
          className="text-2xl sm:text-3xl font-normal leading-snug mb-1"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {AULA_GRATUITA.titulo}
        </h1>
        <p className="text-white/60 text-sm mb-6">
          Boa aula, {primeiroNome}! Uma aula especial pelos 5 anos da NUVEM Medicina 🎉, com a Dra. Vera
          Ângelo e participação do {AULA_GRATUITA.convidado}.
        </p>

        <AulaGratuitaPlayer youtubeId={AULA_GRATUITA.youtubeId} leadId={leadId} titulo={AULA_GRATUITA.titulo} />

        <section className="mt-10 rounded-2xl bg-white text-[#0C1E24] p-6 sm:p-8 grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#8A6D1E] mb-2">
              {AULA_GRATUITA.descontoPct}% de desconto para quem assistiu
            </p>
            <h2 className="text-[#00475E] text-xl sm:text-2xl font-normal leading-snug mb-2" style={{ fontFamily: "Georgia, serif" }}>
              Continue no curso completo de DICI
            </h2>
            <p className="text-sm text-[#5C747A] leading-relaxed max-w-[52ch]">
              Todas as aulas gravadas, os encontros síncronos com discussão de casos e certificado.
              Use o cupom <strong className="text-[#00475E] tracking-wide">{AULA_GRATUITA.cupom}</strong> na matrícula.
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-3">
            <p className="text-sm text-[#5C747A]">
              <s>{precoDe}</s>{" "}
              <strong className="text-[#00475E] text-2xl font-bold ml-1">{precoPor}</strong>
            </p>
            <a
              href={linkMatriculaAulaGratuita()}
              className="inline-block rounded-xl bg-[#00475E] hover:bg-[#003344] px-6 py-3.5 text-white font-bold text-[15px] transition"
            >
              Matricular com {AULA_GRATUITA.descontoPct}% de desconto →
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
