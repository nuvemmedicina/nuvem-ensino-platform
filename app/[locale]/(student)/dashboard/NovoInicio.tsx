import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { BookOpen, ExternalLink, Headphones, PlayCircle, Radio, Video } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { traduzirItem, traduzirModulos } from "@/lib/i18n-content";
import { FundoCartao } from "./FundoCartao";

/**
 * Início da nova área do aluno (redesenho de outubro/2026).
 *
 * Responde a uma pergunta: "o que eu faço agora?". Um único próximo passo
 * em destaque; embaixo, os cursos e os próximos compromissos. Aparece no
 * lugar do painel atual quando a chave em /admin/configuracoes/area-do-aluno
 * libera para esta pessoa.
 */

const FUSO = "America/Sao_Paulo";

function dataLocale(locale: string) {
  return locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";
}

function diaSP(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(d);
}

function fmtDuracao(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

type Aula = {
  id: string;
  title: string;
  duration: number | null;
  type: string;
  videoUrl: string | null;
  audioUrl: string | null;
  muxPlaybackId: string | null;
};

function tipoDaAula(a: Aula): "video" | "audio" | "aoVivo" | "gravacao" | "leitura" | "emBreve" {
  const temVideo = !!(a.muxPlaybackId || a.videoUrl);
  const aoVivo = a.type === "LIVE" || /encontro s[ií]ncrono/i.test(a.title);
  if (aoVivo) return temVideo ? "gravacao" : "aoVivo";
  if (temVideo) return "video";
  if (a.audioUrl) return "audio";
  if (a.type === "TEXT") return "leitura";
  return "emBreve";
}

export async function NovoInicio({ userId, nome, locale }: { userId: string; nome: string; locale: string }) {
  const t = await getTranslations({ locale, namespace: "novaArea.inicio" });
  const tc = await getTranslations({ locale, namespace: "novaArea.curso" });
  const dl = dataLocale(locale);
  const agora = new Date();

  const matriculasRaw = await prisma.enrollment.findMany({
    where: { userId, status: { in: ["ACTIVE", "COMPLETED"] } },
    orderBy: { enrolledAt: "desc" },
    select: {
      id: true,
      status: true,
      enrolledAt: true,
      progress: { select: { lessonId: true, completed: true, updatedAt: true } },
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          titleEs: true,
          titleEn: true,
          hours: true,
          contentUrl: true,
          thumbnailUrl: true,
          studentHeroUrl: true,
          instructor: { select: { user: { select: { name: true, image: true } } } },
          modules: {
            orderBy: { order: "asc" },
            select: {
              title: true,
              titleEs: true,
              titleEn: true,
              releaseDate: true,
              topics: {
                orderBy: { order: "asc" },
                select: {
                  title: true,
                  titleEs: true,
                  titleEn: true,
                  lessons: {
                    orderBy: { order: "asc" },
                    select: { id: true, title: true, titleEs: true, titleEn: true, duration: true, type: true, videoUrl: true, audioUrl: true, muxPlaybackId: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // Títulos no idioma do aluno (vazio = português)
  const matriculas = matriculasRaw.map((m) => ({
    ...m,
    course: { ...traduzirItem(m.course, locale), modules: traduzirModulos(m.course.modules, locale) },
  }));

  const idsCursos = matriculas.map((m) => m.course.id);

  const [aoVivoRaw, liberacoesRaw, catalogoRaw] = await Promise.all([
    idsCursos.length
      ? prisma.liveSession.findMany({
          where: { courseId: { in: idsCursos }, endAt: { gte: agora } },
          orderBy: { startAt: "asc" },
          take: 3,
          select: { id: true, title: true, startAt: true, endAt: true, meetUrl: true, course: { select: { title: true, titleEs: true, titleEn: true } } },
        })
      : Promise.resolve([]),
    idsCursos.length
      ? prisma.module.findMany({
          where: { courseId: { in: idsCursos }, releaseDate: { gt: agora } },
          orderBy: { releaseDate: "asc" },
          take: 2,
          select: { id: true, title: true, titleEs: true, titleEn: true, releaseDate: true },
        })
      : Promise.resolve([]),
    prisma.course.findMany({
      where: { status: "PUBLISHED", id: { notIn: idsCursos } },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, slug: true, title: true, titleEs: true, titleEn: true, hours: true, instructor: { select: { user: { select: { name: true } } } } },
    }),
  ]);

  const aoVivo = aoVivoRaw.map((s) => ({ ...s, course: traduzirItem(s.course, locale) }));
  const liberacoes = liberacoesRaw.map((m) => traduzirItem(m, locale));
  const catalogo = catalogoRaw.map((c) => traduzirItem(c, locale));

  // ── Situação de cada curso ──
  const cursos = matriculas.map((m) => {
    const feitas = new Set(m.progress.filter((p) => p.completed).map((p) => p.lessonId));
    const todas = m.course.modules.flatMap((mod) => mod.topics.flatMap((tp) => tp.lessons));
    const proxima =
      m.course.modules
        .filter((mod) => !mod.releaseDate || mod.releaseDate <= agora)
        .flatMap((mod) => mod.topics.flatMap((tp) => tp.lessons.map((a) => ({ a, mod, tp }))))
        .find(({ a }) => !feitas.has(a.id)) ?? null;
    const ultimaAtividade = m.progress.reduce((max, p) => (p.updatedAt > max ? p.updatedAt : max), m.enrolledAt);
    return {
      m,
      total: todas.length,
      feitas: todas.filter((a) => feitas.has(a.id)).length,
      proxima,
      ultimaAtividade,
      externo: !!m.course.contentUrl && todas.length === 0,
    };
  });

  // ── Próximo passo: aula ao vivo em andamento ou hoje; senão, a próxima
  //    aula do curso estudado mais recentemente. ──
  const vivoHoje = aoVivo.find((s) => s.meetUrl && (s.startAt <= agora || diaSP(s.startAt) === diaSP(agora)));
  const emFoco =
    [...cursos]
      .filter((c) => c.m.status === "ACTIVE" && (c.proxima || c.externo))
      .sort((a, b) => b.ultimaAtividade.getTime() - a.ultimaAtividade.getTime())[0] ?? null;

  // Saudação pelo horário de Brasília, o fuso dos cursos
  const h = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: FUSO }).format(agora));
  const saudacao = h < 12 ? t("bomDia", { nome }) : h < 18 ? t("boaTarde", { nome }) : t("boaNoite", { nome });

  const fmtHora = (d: Date) => new Intl.DateTimeFormat(dl, { hour: "2-digit", minute: "2-digit", timeZone: FUSO }).format(d);

  return (
    <div className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8 min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 flex flex-col gap-9">
        <h1 className="font-serif text-4xl lg:text-5xl font-medium text-foreground leading-tight">{saudacao}</h1>

        {/* ── Seu próximo passo ── */}
        {vivoHoje ? (
          <section aria-labelledby="proximo" className="bg-canvas text-white rounded-3xl px-6 sm:px-10 py-8 sm:py-10 flex flex-wrap gap-6 items-end justify-between">
            <div className="flex-1 min-w-[min(100%,24rem)] flex flex-col gap-2.5">
              <p id="proximo" className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                {t("proximoPasso")}
              </p>
              <p className="font-sans text-sm text-white/70">{vivoHoje.course.title}</p>
              <p className="font-serif text-3xl sm:text-4xl font-medium leading-tight">{vivoHoje.title}</p>
              <p className="font-sans text-sm text-white/70 flex items-center gap-2">
                <Radio className="w-4 h-4" aria-hidden="true" />
                {vivoHoje.startAt <= agora ? t("aoVivoAgora") : t("aoVivoHoje", { hora: fmtHora(vivoHoje.startAt) })} ({t("fusoBrasilia")})
              </p>
            </div>
            <a
              href={vivoHoje.meetUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 min-h-[48px] px-6 rounded-full bg-white text-canvas font-sans text-sm font-semibold hover:bg-white/90"
            >
              <Video className="w-4 h-4" aria-hidden="true" />
              {t("entrarAoVivo")}
              <ExternalLink className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
            </a>
          </section>
        ) : emFoco ? (
          <section aria-labelledby="proximo" className="relative isolate overflow-hidden bg-canvas text-white rounded-3xl px-6 sm:px-10 py-8 sm:py-10 flex flex-wrap gap-6 items-end justify-between">
            <FundoCartao url={emFoco.m.course.studentHeroUrl} />
            <div className="flex-1 min-w-[min(100%,24rem)] flex flex-col gap-2.5">
              <p id="proximo" className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                {t("proximoPasso")}
              </p>
              {emFoco.proxima ? (
                <>
                  <p className="font-sans text-sm text-white/70">
                    {emFoco.proxima.mod.title.split("—")[0].trim()} · {emFoco.proxima.tp.title}
                  </p>
                  <p className="font-serif text-3xl sm:text-4xl font-medium leading-tight text-balance">
                    {emFoco.proxima.a.title.trim()}
                  </p>
                  <p className="font-sans text-sm text-white/70 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1.5">
                      {tipoDaAula(emFoco.proxima.a) === "audio" ? (
                        <Headphones className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <PlayCircle className="w-4 h-4" aria-hidden="true" />
                      )}
                      {tc(`tipo.${tipoDaAula(emFoco.proxima.a)}`)}
                      {emFoco.proxima.a.duration ? ` · ${fmtDuracao(emFoco.proxima.a.duration)}` : ""}
                    </span>
                    <span>{emFoco.m.course.title}</span>
                  </p>
                </>
              ) : (
                <>
                  <p className="font-serif text-3xl sm:text-4xl font-medium leading-tight text-balance">{emFoco.m.course.title}</p>
                  <p className="font-sans text-sm text-white/70">{t("cursoExterno")}</p>
                </>
              )}
              {emFoco.total > 0 && (
                <div className="max-w-md mt-2">
                  <div className="flex justify-between font-sans text-sm text-white/70 mb-1.5">
                    <span>{t("aulasConcluidas", { feitas: emFoco.feitas, total: emFoco.total })}</span>
                    <span className="tabular-nums">{Math.round((emFoco.feitas / emFoco.total) * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round((emFoco.feitas / emFoco.total) * 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {emFoco.proxima ? (
                <Link
                  href={`/dashboard/cursos/${emFoco.m.course.slug}/aulas/${emFoco.proxima.a.id}`}
                  className="inline-flex items-center gap-2.5 min-h-[48px] px-6 rounded-full bg-white text-canvas font-sans text-sm font-semibold hover:bg-white/90"
                >
                  <PlayCircle className="w-4 h-4" aria-hidden="true" />
                  {emFoco.feitas > 0 ? t("continuarAula") : t("comecarAula")}
                </Link>
              ) : (
                <a
                  href={emFoco.m.course.contentUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 min-h-[48px] px-6 rounded-full bg-white text-canvas font-sans text-sm font-semibold hover:bg-white/90"
                >
                  <Video className="w-4 h-4" aria-hidden="true" />
                  {tc("proximo.externo")}
                </a>
              )}
              <Link
                href={`/dashboard/cursos/${emFoco.m.course.slug}`}
                className="inline-flex items-center min-h-[48px] px-5 rounded-full border border-white/30 font-sans text-sm text-white hover:bg-white/10"
              >
                {t("abrirCurso")}
              </Link>
            </div>
          </section>
        ) : cursos.length === 0 ? (
          <section className="bg-surface border border-border rounded-3xl px-6 sm:px-10 py-8 flex flex-wrap gap-4 items-center justify-between">
            <p className="font-sans text-[15px] text-foreground">{t("semCursos")}</p>
            <Link href="/cursos" className="inline-flex items-center min-h-[48px] px-6 rounded-full bg-primary text-white font-sans text-sm font-semibold">
              {t("verCatalogo")}
            </Link>
          </section>
        ) : (
          <p className="font-sans text-[15px] text-muted">{t("tudoConcluido")}</p>
        )}

        <div className="grid gap-8 md:grid-cols-2 items-start">
          {/* ── Meus cursos ── */}
          {cursos.length > 0 && (
            <section aria-labelledby="meus-cursos" className="flex flex-col gap-3 min-w-0">
              <div className="flex items-baseline justify-between">
                <h2 id="meus-cursos" className="font-sans text-lg font-semibold text-foreground">{t("meusCursos")}</h2>
                <Link href="/dashboard/cursos" className="font-sans text-sm text-primary hover:underline">
                  {t("verTodos")}
                </Link>
              </div>
              <ul className="flex flex-col gap-3">
                {cursos.slice(0, 4).map((c) => {
                  const pct = c.total ? Math.round((c.feitas / c.total) * 100) : c.m.status === "COMPLETED" ? 100 : 0;
                  const capa = c.m.course.thumbnailUrl ?? c.m.course.instructor.user.image;
                  return (
                    <li key={c.m.id}>
                      <Link
                        href={`/dashboard/cursos/${c.m.course.slug}`}
                        className="flex gap-4 items-center bg-surface border border-border rounded-2xl p-3.5 hover:border-primary/40"
                      >
                        <span className="relative w-16 h-20 shrink-0 rounded-xl overflow-hidden bg-canvas">
                          {capa ? (
                            <Image src={capa} alt="" fill sizes="64px" className="object-cover" />
                          ) : (
                            <BookOpen className="absolute inset-0 m-auto w-6 h-6 text-white/40" aria-hidden="true" />
                          )}
                        </span>
                        <span className="flex-1 min-w-0 flex flex-col gap-1.5">
                          <span className="font-sans text-[15px] font-semibold text-foreground leading-snug line-clamp-2">
                            {c.m.course.title}
                          </span>
                          <span className="font-sans text-sm text-muted">
                            {c.m.course.instructor.user.name} · {c.m.course.hours}h
                          </span>
                          {c.m.status === "COMPLETED" ? (
                            <span className="font-sans text-xs font-semibold text-green-800">{t("concluido")}</span>
                          ) : c.total > 0 ? (
                            <span className="flex items-center gap-2.5">
                              <span className="flex-1 h-1.5 rounded-full bg-border/60">
                                <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                              </span>
                              <span className="font-sans text-xs text-muted tabular-nums">{pct}%</span>
                            </span>
                          ) : (
                            <span className="font-sans text-xs text-muted">{t("cursoExterno")}</span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* ── Próximos compromissos ── */}
          {cursos.length > 0 && (
            <section aria-labelledby="compromissos" className="flex flex-col gap-3 min-w-0">
              <h2 id="compromissos" className="font-sans text-lg font-semibold text-foreground">{t("compromissos")}</h2>
              <div className="bg-surface border border-border rounded-2xl">
                {aoVivo.length === 0 && liberacoes.length === 0 ? (
                  <p className="font-sans text-sm text-muted px-5 py-5">{t("semCompromissos")}</p>
                ) : (
                  <ul>
                    {[
                      ...aoVivo.map((s) => ({ id: s.id, quando: s.startAt, titulo: s.title, meta: `${fmtHora(s.startAt)} (${t("fusoBrasilia")})`, tipo: "aoVivo" as const })),
                      ...liberacoes.map((m) => ({ id: m.id, quando: m.releaseDate!, titulo: m.title.split("—")[0].trim(), meta: t("liberacaoTexto"), tipo: "liberacao" as const })),
                    ]
                      .sort((a, b) => a.quando.getTime() - b.quando.getTime())
                      .slice(0, 4)
                      .map((ev) => (
                        <li key={ev.id} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-b-0">
                          <span className="w-14 shrink-0 rounded-xl bg-background py-1.5 text-center">
                            <span className="block font-sans text-xs font-semibold uppercase text-muted">
                              {new Intl.DateTimeFormat(dl, { month: "short", timeZone: FUSO }).format(ev.quando).replace(".", "")}
                            </span>
                            <span className="block font-sans text-xl font-semibold text-foreground tabular-nums leading-tight">
                              {new Intl.DateTimeFormat(dl, { day: "numeric", timeZone: FUSO }).format(ev.quando)}
                            </span>
                          </span>
                          <span className="flex-1 min-w-0 flex flex-col">
                            <span className="font-sans text-[15px] font-semibold text-foreground">{ev.titulo}</span>
                            <span className="font-sans text-sm text-muted">{ev.meta}</span>
                          </span>
                          <span
                            className={`font-sans text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                              ev.tipo === "aoVivo" ? "bg-accent/60 text-primary" : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            {ev.tipo === "aoVivo" ? t("aoVivo") : t("liberacao")}
                          </span>
                        </li>
                      ))}
                  </ul>
                )}
                <Link
                  href="/dashboard/aulas-ao-vivo"
                  className="block px-5 py-3.5 border-t border-border font-sans text-sm text-primary hover:underline"
                >
                  {t("agendaCompleta")}
                </Link>
              </div>
            </section>
          )}
        </div>

        {/* ── Conheça também ── */}
        {catalogo.length > 0 && (
          <section aria-labelledby="catalogo" className="flex flex-col gap-3">
            <h2 id="catalogo" className="font-sans text-lg font-semibold text-foreground">{t("conhecaTambem")}</h2>
            <ul className="grid gap-3 sm:grid-cols-3">
              {catalogo.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/cursos/${c.slug}`}
                    className="flex flex-col gap-1 h-full bg-surface border border-border rounded-2xl px-4 py-3.5 hover:border-primary/40"
                  >
                    <span className="font-sans text-[15px] font-semibold text-foreground leading-snug">{c.title}</span>
                    <span className="font-sans text-sm text-muted">
                      {c.instructor.user.name} · {c.hours}h
                    </span>
                    <span className="mt-auto pt-1 font-sans text-sm font-semibold text-primary">{t("verCurso")} →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
