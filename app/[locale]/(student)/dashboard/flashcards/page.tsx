import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Layers, Lock } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { estruturaParaUsuario, type GrupoResumo } from "@/lib/flashcards";
import { moduleColor, type ModuleColor } from "@/lib/moduleColors";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";

const escuro = (cor: string, pct = 60) => `color-mix(in srgb, ${cor} ${pct}%, black)`;

/** Card de um tema com flashcards, em degradê na cor do módulo. */
function CardDoGrupo({ grupo, cor, numero, vezes }: { grupo: GrupoResumo; cor: ModuleColor; numero: number | null; vezes: number }) {
  const t = useTranslations("novaArea.paginas.flashcards");
  return (
    <Link
      href={`/dashboard/flashcards/${grupo.id}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-border bg-surface hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
    >
      <div
        className="relative aspect-[16/10] overflow-hidden"
        style={{ background: `linear-gradient(140deg, ${cor.accent} 0%, ${escuro(cor.accent)} 100%)` }}
      >
        {grupo.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={grupo.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-luminosity" />
          </>
        ) : (
          <>
            <div aria-hidden="true" className="absolute -right-8 -bottom-10 w-32 h-32 rounded-full bg-white/10" />
            <div aria-hidden="true" className="absolute -left-6 -top-8 w-24 h-24 rounded-full bg-white/[0.07]" />
          </>
        )}
        <Layers aria-hidden="true" className="absolute right-3 bottom-3 w-9 h-9 text-white/25 group-hover:text-white/40 group-hover:scale-110 transition-all" />
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          {numero !== null && (
            <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-white/85">{t("tema", { n: numero })}</span>
          )}
          <span className="ml-auto font-sans text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
            {t("cards", { n: grupo.cards })}
          </span>
        </div>
        {vezes > 0 && (
          <span className="absolute left-3 bottom-3 inline-flex items-center gap-1 font-sans text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#2E7D55]">
            <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> {t("estudado")}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-2 px-3.5 py-3">
        <h3 className="font-sans text-[14px] font-semibold text-foreground leading-snug line-clamp-2">{grupo.title}</h3>
        <span className="mt-auto inline-flex items-center gap-1 font-sans text-xs font-semibold" style={{ color: cor.accent }}>
          {vezes > 0 ? t("revisar") : t("comecar")}
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

/** Lugar reservado do tema que ainda não tem flashcards. */
function CardVazio({ titulo, cor, numero }: { titulo: string; cor: ModuleColor; numero: number }) {
  const t = useTranslations("novaArea.paginas.flashcards");
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-dashed" style={{ borderColor: cor.border }}>
      <div className="relative aspect-[16/10] flex items-center justify-center" style={{ background: cor.tint }}>
        <span className="absolute left-3 top-3 font-sans text-[10px] font-bold uppercase tracking-widest" style={{ color: cor.accent, opacity: 0.55 }}>
          {t("tema", { n: numero })}
        </span>
        <Lock className="w-6 h-6" style={{ color: cor.accent, opacity: 0.4 }} aria-hidden="true" />
      </div>
      <div className="px-3.5 py-3">
        <h3 className="font-sans text-[14px] font-medium text-muted leading-snug line-clamp-2">{titulo}</h3>
        <p className="font-sans text-[11px] text-muted/70 mt-1">{t("emBreve")}</p>
      </div>
    </div>
  );
}

export default async function FlashcardsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "novaArea.paginas.flashcards" });
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard/flashcards");

  const role = (session.user as { role?: string }).role;
  const [{ cursos, gerais }, sessoes] = await Promise.all([
    estruturaParaUsuario(session.user.id, role, locale),
    // Sessões terminadas por grupo: dizem o que o aluno já estudou
    prisma.flashcardStudySession.groupBy({
      by: ["groupId"],
      where: { userId: session.user.id, finishedAt: { not: null } },
      _count: { _all: true },
    }),
  ]);
  const vezesPorGrupo = new Map(sessoes.map((s) => [s.groupId, s._count._all]));

  const grupos = [
    ...cursos.flatMap((c) => [...c.modulos.flatMap((m) => m.topicos.flatMap((tp) => (tp.grupo ? [tp.grupo] : []))), ...c.soltos]),
    ...gerais,
  ];
  const totalCards = grupos.reduce((n, g) => n + g.cards, 0);
  const estudados = grupos.filter((g) => vezesPorGrupo.has(g.id)).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-10">
      {/* Cabeçalho */}
      <header
        className="relative overflow-hidden rounded-3xl px-6 sm:px-10 py-8 text-white"
        style={{ background: `linear-gradient(135deg, #00475E 0%, ${escuro("#00475E", 55)} 100%)` }}
      >
        <div aria-hidden="true" className="absolute -right-12 -top-20 w-72 h-72 rounded-full bg-white/10" />
        <div aria-hidden="true" className="absolute right-32 -bottom-24 w-48 h-48 rounded-full bg-white/[0.06]" />
        <Layers aria-hidden="true" className="absolute right-8 bottom-6 w-20 h-20 text-white/10" />
        <div className="relative flex flex-col gap-3 max-w-xl">
          <h1 className="font-serif text-4xl sm:text-5xl font-medium leading-tight">{t("titulo")}</h1>
          <p className="font-sans text-[15px] text-white/75">{t("subtitulo")}</p>
          {grupos.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="font-sans text-xs font-semibold px-3 py-1.5 rounded-full bg-white/15">{t("statTemas", { n: grupos.length })}</span>
              <span className="font-sans text-xs font-semibold px-3 py-1.5 rounded-full bg-white/15">{t("cards", { n: totalCards })}</span>
              <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold px-3 py-1.5 rounded-full bg-white text-[#00475E]">
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                {t("statEstudados", { feitos: estudados, total: grupos.length })}
              </span>
            </div>
          )}
        </div>
      </header>

      {grupos.length === 0 && (
        <div className="border border-border rounded-2xl px-6 py-16 text-center">
          <Layers className="w-8 h-8 text-muted/40 mx-auto mb-3" aria-hidden="true" />
          <p className="font-sans text-sm text-muted">{t("vazio")}</p>
        </div>
      )}

      {cursos
        // Curso sem nenhum tema nem grupo solto não tem o que mostrar (a equipe vê todos os cursos)
        .filter((curso) => curso.soltos.length > 0 || curso.modulos.some((m) => m.topicos.length > 0))
        .map((curso) => (
        <section key={curso.id} className="flex flex-col gap-8">
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-foreground text-balance">{curso.title}</h2>

          {curso.modulos.map((modulo) => {
            if (modulo.topicos.length === 0) return null;
            const cor = moduleColor(modulo.indice);
            const comGrupo = modulo.topicos.filter((tp) => tp.grupo);
            const feitos = comGrupo.filter((tp) => vezesPorGrupo.has(tp.grupo!.id)).length;
            const pct = comGrupo.length ? Math.round((feitos / comGrupo.length) * 100) : 0;

            return (
              <div key={modulo.id} className="flex flex-col gap-4">
                {/* Faixa do módulo */}
                <div
                  className="relative overflow-hidden rounded-2xl px-4 sm:px-5 py-3.5 text-white flex flex-wrap items-center gap-x-4 gap-y-2"
                  style={{ background: `linear-gradient(120deg, ${cor.accent} 0%, ${escuro(cor.accent, 70)} 100%)` }}
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/15 font-sans text-sm font-bold shrink-0">
                    {modulo.indice + 1}
                  </span>
                  <h3 className="flex-1 min-w-[12rem] font-sans text-[15px] font-semibold leading-snug">{modulo.title}</h3>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-24 h-1.5 rounded-full bg-white/20 overflow-hidden" aria-hidden="true">
                      <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="font-sans text-xs tabular-nums text-white/85">{t("estudadosModulo", { feitos, total: comGrupo.length })}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {modulo.topicos.map((topico, i) =>
                    topico.grupo ? (
                      <CardDoGrupo
                        key={topico.id}
                        grupo={{ ...topico.grupo, title: topico.title }}
                        cor={cor}
                        numero={i + 1}
                        vezes={vezesPorGrupo.get(topico.grupo.id) ?? 0}
                      />
                    ) : (
                      <CardVazio key={topico.id} titulo={topico.title} cor={cor} numero={i + 1} />
                    ),
                  )}
                </div>
              </div>
            );
          })}

          {curso.soltos.length > 0 && (
            <div className="flex flex-col gap-4">
              <p className="font-sans text-xs font-semibold text-muted uppercase tracking-wider">{t("semTopico")}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {curso.soltos.map((g) => (
                  <CardDoGrupo key={g.id} grupo={g} cor={moduleColor(0)} numero={null} vezes={vezesPorGrupo.get(g.id) ?? 0} />
                ))}
              </div>
            </div>
          )}
        </section>
      ))}

      {gerais.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-2xl font-medium text-foreground">{t("materialGeral")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {gerais.map((g) => (
              <CardDoGrupo key={g.id} grupo={g} cor={moduleColor(0)} numero={null} vezes={vezesPorGrupo.get(g.id) ?? 0} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
