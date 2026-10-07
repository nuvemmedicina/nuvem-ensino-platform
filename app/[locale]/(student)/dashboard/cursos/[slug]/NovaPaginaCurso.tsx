import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Award,
  BarChart2,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Headphones,
  Layers,
  Lock,
  MessageCircle,
  PlayCircle,
  Radio,
  Star,
  Video,
} from "lucide-react";
import { moduleColor } from "@/lib/moduleColors";
import { ModuleQuizPanel } from "./ModuleQuizPanel";
import { TreinoPanel } from "./TreinoPanel";
import { DominioTemas } from "./DominioTemas";
import { RespiratoryGameInvite } from "./RespiratoryGameInvite";
import { CompleteCourseButton } from "./CompleteCourseButton";

/**
 * Página do curso da nova área do aluno (redesenho de outubro/2026).
 *
 * Aparece no lugar da página atual quando a chave em
 * /admin/configuracoes/area-do-aluno libera para esta pessoa. Os dados são
 * os mesmos; muda a organização: cada tipo de conteúdo tem um lugar fixo,
 * nas mesmas cinco abas em todos os cursos, e o topo mostra um único
 * próximo passo.
 */

export const ABAS = ["visao-geral", "aulas", "avaliacoes", "materiais", "comunidade"] as const;
export type Aba = (typeof ABAS)[number];

type Professor = { id: string; title: string | null; displayOrder: number; user: { name: string | null } };

type Aula = {
  id: string;
  title: string;
  duration: number | null;
  type: string;
  videoUrl: string | null;
  audioUrl: string | null;
  muxPlaybackId: string | null;
  instructors: { instructor: Professor }[];
};

type Topico = {
  id: string;
  title: string;
  apostilaUrl: string | null;
  lessons: Aula[];
  flashcardGroups: { id: string; _count: { cards: number } }[];
};

type Prova = {
  id: string;
  title: string;
  availableFrom: Date | null;
  availableUntil: Date | null;
  passingPct: number;
  maxAttempts: number;
  questionsPerAttempt: number | null;
  practiceEnabled: boolean;
  _count: { questions: number };
};

type Modulo = {
  id: string;
  title: string;
  releaseDate: Date | null;
  topics: Topico[];
  quiz: Prova | null;
};

type Tentativa = { quizId: string; score: number; total: number; passed: boolean; createdAt: Date };

export type NovaPaginaCursoProps = {
  locale: string;
  aba: Aba;
  sucesso: boolean;
  course: {
    id: string;
    slug: string;
    title: string;
    shortDesc: string | null;
    hours: number;
    contentUrl: string | null;
    instructor: Professor;
    modules: Modulo[];
  };
  progressMap: Record<string, boolean>;
  nextLesson: Aula | null;
  tentativas: Tentativa[];
  provaAtualId: string | null;
  aoVivo: { title: string; startAt: Date; endAt: Date; meetUrl: string | null; calendarUrl: string } | null;
  dominioTemas: Parameters<typeof DominioTemas>[0]["temas"];
  certificadoId: string | null;
  referencias: { id: string; title: string; fileUrl: string }[];
  whatsappUrl: string | null;
  temJogo: boolean;
};

const FUSO = "America/Sao_Paulo";

function dataLocale(locale: string) {
  return locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";
}

function fmtDuracao(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** "Módulo II — DICI na Prática Clínica" → "Módulo II" */
function nomeCurto(titulo: string) {
  return titulo.split("—")[0].trim();
}

function liberado(m: Modulo, agora: Date) {
  return !m.releaseDate || m.releaseDate <= agora;
}

type Tipo = "video" | "audio" | "aoVivo" | "gravacao" | "leitura" | "emBreve";

function tipoDaAula(a: Aula): Tipo {
  const temVideo = !!(a.muxPlaybackId || a.videoUrl);
  const aoVivo = a.type === "LIVE" || /encontro s[ií]ncrono/i.test(a.title);
  if (aoVivo) return temVideo ? "gravacao" : "aoVivo";
  if (temVideo) return "video";
  if (a.audioUrl) return "audio";
  if (a.type === "TEXT") return "leitura";
  return "emBreve";
}

function IconeTipo({ tipo }: { tipo: Tipo }) {
  const cls = "w-[18px] h-[18px]";
  if (tipo === "audio") return <Headphones className={cls} aria-hidden="true" />;
  if (tipo === "aoVivo" || tipo === "gravacao") return <Radio className={cls} aria-hidden="true" />;
  if (tipo === "leitura") return <FileText className={cls} aria-hidden="true" />;
  return <PlayCircle className={cls} aria-hidden="true" />;
}

export async function NovaPaginaCurso(props: NovaPaginaCursoProps) {
  const { locale, aba, sucesso, course, progressMap, nextLesson, tentativas, provaAtualId, aoVivo } = props;
  const t = await getTranslations({ locale, namespace: "novaArea.curso" });
  const dl = dataLocale(locale);
  const agora = new Date();
  const base = `/dashboard/cursos/${course.slug}`;
  const linkAula = (id: string) => `${base}/aulas/${id}`;
  const linkAba = (a: Aba) => `${base}?aba=${a}`;
  const fmtDia = (d: Date) => new Intl.DateTimeFormat(dl, { day: "numeric", month: "long", timeZone: FUSO }).format(d);

  // ── Números do curso ──
  const todasAulas = course.modules.flatMap((m) => m.topics.flatMap((tp) => tp.lessons));
  const totalAulas = todasAulas.length;
  const aulasFeitas = todasAulas.filter((a) => progressMap[a.id]).length;
  const pct = totalAulas ? Math.round((aulasFeitas / totalAulas) * 100) : 0;

  const modulosComProva = course.modules.filter((m) => m.quiz && m.quiz._count.questions > 0);
  const aprovadas = modulosComProva.filter((m) => tentativas.some((a) => a.quizId === m.quiz!.id && a.passed));
  const cursoExterno = !!course.contentUrl && totalAulas === 0;

  // Todos os professores do curso, cada um com o seu cargo. A ordem segue
  // displayOrder: a Dra. Vera e a Dra. Eliane, sócias fundadoras da Nuvem,
  // vêm sempre primeiro; os demais, em ordem alfabética.
  const professores = Array.from(
    new Map(
      [course.instructor, ...todasAulas.flatMap((a) => a.instructors.map((i) => i.instructor))]
        .filter((p) => !!p.user.name)
        .map((p) => [p.id, p] as const),
    ).values(),
  ).sort((a, b) => a.displayOrder - b.displayOrder || (a.user.name ?? "").localeCompare(b.user.name ?? "", "pt-BR"));

  // ── Situação de cada prova ──
  type Situacao = "aprovado" | "aberta" | "abreEm" | "esgotada" | "fechada" | "semQuestoes";
  function situacaoDaProva(m: Modulo): { situacao: Situacao; melhor?: Tentativa } {
    const q = m.quiz!;
    const minhas = tentativas.filter((a) => a.quizId === q.id);
    const aprovada = minhas.find((a) => a.passed);
    if (aprovada) {
      const melhor = minhas.reduce((b, a) => (a.score > b.score ? a : b), aprovada);
      return { situacao: "aprovado", melhor };
    }
    if (!liberado(m, agora)) return { situacao: "abreEm" };
    if (q._count.questions === 0) return { situacao: "semQuestoes" };
    const janela = (!q.availableFrom || q.availableFrom <= agora) && (!q.availableUntil || q.availableUntil >= agora);
    if (!janela) return { situacao: "fechada" };
    if (minhas.length >= q.maxAttempts) return { situacao: "esgotada" };
    return { situacao: "aberta" };
  }

  // ── Próximo passo: uma única ação no topo, escolhida por regra ──
  type Passo = { rotulo: string; href: string; externo?: boolean };
  let passo: Passo | null = null;
  if (aoVivo && aoVivo.meetUrl) {
    const emAndamento = aoVivo.startAt <= agora && aoVivo.endAt >= agora;
    const mesmoDia =
      new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(aoVivo.startAt) ===
      new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(agora);
    if (emAndamento) passo = { rotulo: t("proximo.aoVivo"), href: aoVivo.meetUrl, externo: true };
    else if (mesmoDia) {
      const hora = new Intl.DateTimeFormat(dl, { hour: "2-digit", minute: "2-digit", timeZone: FUSO }).format(aoVivo.startAt);
      passo = { rotulo: t("proximo.aoVivoHoje", { hora }), href: aoVivo.meetUrl, externo: true };
    }
  }
  if (!passo && provaAtualId) {
    const m = course.modules.find((x) => x.quiz?.id === provaAtualId);
    const aulasDoModulo = m ? m.topics.flatMap((tp) => tp.lessons) : [];
    if (m && situacaoDaProva(m).situacao === "aberta" && aulasDoModulo.every((a) => progressMap[a.id])) {
      passo = { rotulo: t("proximo.prova", { modulo: nomeCurto(m.title) }), href: linkAba("avaliacoes") };
    }
  }
  if (!passo && cursoExterno) passo = { rotulo: t("proximo.externo"), href: course.contentUrl!, externo: true };
  if (!passo && nextLesson && aulasFeitas < totalAulas) {
    passo = {
      rotulo: aulasFeitas > 0 ? t("proximo.continuar", { titulo: nextLesson.title.trim() }) : t("proximo.comecar", { titulo: nextLesson.title.trim() }),
      href: linkAula(nextLesson.id),
    };
  }
  if (!passo && props.certificadoId) passo = { rotulo: t("proximo.verCertificado"), href: `/dashboard/certificados/${props.certificadoId}` };

  // Módulo aberto por padrão na aba Aulas: o da próxima aula.
  const moduloAberto =
    course.modules.find((m) => nextLesson && m.topics.some((tp) => tp.lessons.some((a) => a.id === nextLesson.id)))?.id ??
    course.modules.find((m) => liberado(m, agora))?.id;

  const abaClasse = (ativa: boolean) =>
    `font-sans text-[15px] px-5 min-h-[46px] inline-flex items-center rounded-t-xl transition-colors ${
      ativa ? "bg-background text-canvas font-semibold" : "text-white/70 hover:text-white"
    }`;

  return (
    <div className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8 min-h-screen bg-background">
      {/* ── Cabeçalho ── */}
      <header className="bg-canvas text-white px-6 lg:px-10 pt-7">
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
          <Link href="/dashboard/cursos" className="font-sans text-sm text-white/60 hover:text-white w-fit">
            ← {t("voltar")}
          </Link>

          <div className="flex flex-wrap gap-6 items-end justify-between">
            <div className="flex-1 min-w-[min(100%,28rem)] flex flex-col gap-3">
              <h1 className="font-serif text-3xl lg:text-4xl font-medium leading-tight text-balance">{course.title}</h1>
              <p className="font-sans text-sm text-white/70 flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  {course.instructor.user.name}
                  {professores.length > 1 && ` ${t("eEquipe")}`}
                </span>
                <span>{t("horas", { horas: course.hours })}</span>
              </p>

              {totalAulas > 0 && (
                <div className="max-w-md">
                  <div className="flex justify-between font-sans text-sm text-white/70 mb-1.5">
                    <span>{t("aulasConcluidas", { feitas: aulasFeitas, total: totalAulas })}</span>
                    <span className="tabular-nums">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}

              {props.certificadoId ? (
                <Link
                  href={`/dashboard/certificados/${props.certificadoId}`}
                  className="w-fit inline-flex items-center gap-2 font-sans text-sm min-h-[40px] px-4 rounded-full border border-white/30 hover:bg-white/10"
                >
                  <Award className="w-4 h-4" aria-hidden="true" />
                  {t("certificadoDisponivel")}
                </Link>
              ) : (
                modulosComProva.length > 0 && (
                  <Link
                    href={linkAba("visao-geral")}
                    className="w-fit inline-flex items-center gap-2 font-sans text-sm min-h-[40px] px-4 rounded-full border border-white/30 hover:bg-white/10"
                  >
                    <Award className="w-4 h-4" aria-hidden="true" />
                    {t("certificado")}: {t("provasAprovadas", { feitas: aprovadas.length, total: modulosComProva.length })} ·{" "}
                    {t("verOQueFalta")}
                  </Link>
                )
              )}
            </div>

            {passo &&
              (passo.externo ? (
                <a
                  href={passo.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 min-h-[48px] px-6 rounded-full bg-white text-canvas font-sans text-sm font-semibold hover:bg-white/90 max-w-full"
                >
                  <Video className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{passo.rotulo}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" aria-hidden="true" />
                </a>
              ) : (
                <Link
                  href={passo.href}
                  className="inline-flex items-center gap-2.5 min-h-[48px] px-6 rounded-full bg-white text-canvas font-sans text-sm font-semibold hover:bg-white/90 max-w-full"
                >
                  <PlayCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{passo.rotulo}</span>
                </Link>
              ))}
          </div>

          <nav aria-label={t("secoes")} className="flex flex-wrap gap-1 mt-3 -mb-px">
            {ABAS.map((a) => (
              <Link key={a} href={linkAba(a)} scroll={false} aria-current={aba === a ? "page" : undefined} className={abaClasse(aba === a)}>
                {t(`abas.${a}`)}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Conteúdo da aba ── */}
      <div className="px-6 lg:px-10 py-8">
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
          {sucesso && (
            <p className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-800 rounded-xl px-4 py-3 font-sans text-sm">
              <Award className="w-4 h-4 shrink-0" aria-hidden="true" />
              {t("sucesso")}
            </p>
          )}

          {/* ── Aulas ── */}
          {aba === "aulas" &&
            course.modules.map((m, i) => {
              const cor = moduleColor(i);
              const aulas = m.topics.flatMap((tp) => tp.lessons);
              const feitas = aulas.filter((a) => progressMap[a.id]).length;
              const aberto = liberado(m, agora);
              const concluido = aberto && aulas.length > 0 && feitas === aulas.length;

              const resumo = (
                <>
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-sans text-sm font-semibold text-white"
                    style={{ backgroundColor: aberto ? cor.accent : "#8A989D" }}
                    aria-hidden="true"
                  >
                    {aberto ? i + 1 : <Lock className="w-4 h-4" />}
                  </span>
                  <span className="flex-1 min-w-0 flex flex-col">
                    <span className="font-sans text-base font-semibold text-foreground">{m.title}</span>
                    <span className="font-sans text-sm text-muted">
                      {aberto ? t("modulo.progresso", { feitas, total: aulas.length }) : t("modulo.aulas", { count: aulas.length })}
                    </span>
                  </span>
                  {!aberto && m.releaseDate ? (
                    <span className="font-sans text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 shrink-0">
                      {t("modulo.abreEm", { data: fmtDia(m.releaseDate) })}
                    </span>
                  ) : concluido ? (
                    <span className="font-sans text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-800 shrink-0">
                      {t("modulo.concluido")}
                    </span>
                  ) : feitas > 0 ? (
                    <span className="font-sans text-xs font-semibold px-2.5 py-1 rounded-full bg-accent/60 text-primary shrink-0">
                      {t("modulo.emAndamento")}
                    </span>
                  ) : null}
                </>
              );

              if (!aberto) {
                return (
                  <section key={m.id} className="bg-surface border border-border rounded-2xl px-5 py-4 flex items-center gap-4">
                    {resumo}
                  </section>
                );
              }

              const prova = m.quiz && m.quiz._count.questions > 0 ? m.quiz : null;

              return (
                <details key={m.id} open={m.id === moduloAberto} className="group bg-surface border border-border rounded-2xl">
                  <summary className="list-none cursor-pointer px-5 py-4 flex items-center gap-4 min-h-[64px] [&::-webkit-details-marker]:hidden">
                    {resumo}
                    <ChevronDown className="w-5 h-5 text-muted shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <div className="border-t border-border px-3 sm:px-5 pb-4">
                    {m.topics.map((tp) => {
                      const feitasTopico = tp.lessons.filter((a) => progressMap[a.id]).length;
                      const grupo = tp.flashcardGroups[0];
                      return (
                        <div key={tp.id} className="pt-4">
                          <div className="flex items-baseline justify-between gap-3 px-2 pb-1.5">
                            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-muted">{tp.title}</h3>
                            <span className="flex items-center gap-3 shrink-0">
                              {tp.apostilaUrl && (
                                <a
                                  href={tp.apostilaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-sans text-xs font-semibold text-primary hover:underline"
                                >
                                  {t("modulo.apostila")}
                                </a>
                              )}
                              <span className="font-sans text-xs text-muted tabular-nums">
                                {feitasTopico}/{tp.lessons.length}
                              </span>
                            </span>
                          </div>
                          <ul className="flex flex-col">
                            {tp.lessons.map((a) => {
                              const tipo = tipoDaAula(a);
                              const feita = !!progressMap[a.id];
                              const atual = nextLesson?.id === a.id && !feita;
                              return (
                                <li key={a.id}>
                                  <Link
                                    href={linkAula(a.id)}
                                    className={`flex items-center gap-3.5 px-2 py-2.5 min-h-[52px] rounded-xl transition-colors ${
                                      atual ? "bg-accent/40" : "hover:bg-background"
                                    }`}
                                  >
                                    <span className="w-8 h-8 rounded-lg bg-background text-primary flex items-center justify-center shrink-0">
                                      <IconeTipo tipo={tipo} />
                                    </span>
                                    <span className="flex-1 min-w-0 flex flex-col">
                                      <span className={`font-sans text-[15px] text-foreground ${atual ? "font-semibold" : ""}`}>
                                        {a.title.trim()}
                                      </span>
                                      <span className="font-sans text-sm text-muted">
                                        {t(`tipo.${tipo}`)}
                                        {a.duration ? ` · ${fmtDuracao(a.duration)}` : ""}
                                      </span>
                                    </span>
                                    {feita ? (
                                      <span className="w-6 h-6 rounded-full bg-green-700 text-white flex items-center justify-center shrink-0">
                                        <Check className="w-3.5 h-3.5" strokeWidth={3} aria-label={t("modulo.concluido")} />
                                      </span>
                                    ) : atual ? (
                                      <span className="font-sans text-xs font-semibold text-primary shrink-0">{t("modulo.voceParou")}</span>
                                    ) : null}
                                  </Link>
                                </li>
                              );
                            })}
                            {grupo && (
                              <li>
                                <Link
                                  href={`/dashboard/flashcards/${grupo.id}`}
                                  className="flex items-center gap-3.5 px-2 py-2.5 min-h-[52px] rounded-xl hover:bg-background"
                                >
                                  <span className="w-8 h-8 rounded-lg bg-background text-primary flex items-center justify-center shrink-0">
                                    <Layers className="w-[18px] h-[18px]" aria-hidden="true" />
                                  </span>
                                  <span className="flex-1 min-w-0 flex flex-col">
                                    <span className="font-sans text-[15px] text-foreground">{t("modulo.flashcards")}</span>
                                    <span className="font-sans text-sm text-muted">{t("modulo.cartoes", { count: grupo._count.cards })}</span>
                                  </span>
                                </Link>
                              </li>
                            )}
                          </ul>
                        </div>
                      );
                    })}
                    {prova && (
                      <Link
                        href={linkAba("avaliacoes")}
                        className="mt-4 flex items-center gap-3.5 px-2 py-2.5 min-h-[52px] rounded-xl border border-border hover:bg-background"
                      >
                        <span className="w-8 h-8 rounded-lg bg-background text-primary flex items-center justify-center shrink-0">
                          <ClipboardCheck className="w-[18px] h-[18px]" aria-hidden="true" />
                        </span>
                        <span className="flex-1 min-w-0 flex flex-col">
                          <span className="font-sans text-[15px] font-semibold text-foreground">{t("modulo.provaItem")}</span>
                          <span className="font-sans text-sm text-muted">
                            {t("modulo.provaRegra", {
                              questoes: prova.questionsPerAttempt ?? prova._count.questions,
                              nota: prova.passingPct,
                            })}
                          </span>
                        </span>
                      </Link>
                    )}
                  </div>
                </details>
              );
            })}

          {/* ── Avaliações ── */}
          {aba === "avaliacoes" && (
            <>
              {modulosComProva.length > 0 && (
                <section className="bg-surface border border-border rounded-2xl">
                  <h2 className="font-sans text-lg font-semibold text-foreground px-5 pt-5 pb-2">{t("avaliacoes.provas")}</h2>
                  <ul>
                    {modulosComProva.map((m) => {
                      const q = m.quiz!;
                      const { situacao, melhor } = situacaoDaProva(m);
                      return (
                        <li key={m.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4 border-t border-border first:border-t-0">
                          <span className="flex-1 min-w-[min(100%,18rem)] flex flex-col">
                            <span className="font-sans text-[15px] font-semibold text-foreground">{q.title || nomeCurto(m.title)}</span>
                            <span className="font-sans text-sm text-muted">
                              {nomeCurto(m.title)} ·{" "}
                              {t("avaliacoes.regra", {
                                questoes: q.questionsPerAttempt ?? q._count.questions,
                                nota: q.passingPct,
                                tentativas: q.maxAttempts,
                              })}
                            </span>
                          </span>
                          <span
                            className={`font-sans text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${
                              situacao === "aprovado"
                                ? "bg-amber-100 text-amber-900"
                                : situacao === "aberta"
                                  ? "bg-accent/60 text-primary"
                                  : "bg-background text-muted"
                            }`}
                          >
                            {situacao === "aprovado" && melhor
                              ? t("avaliacoes.aprovado", { acertos: melhor.score, total: melhor.total })
                              : situacao === "abreEm" && m.releaseDate
                                ? t("avaliacoes.abreEm", { data: fmtDia(m.releaseDate) })
                                : situacao === "aberta"
                                  ? t("avaliacoes.aberta")
                                  : situacao === "esgotada"
                                    ? t("avaliacoes.esgotada")
                                    : situacao === "semQuestoes"
                                      ? t("avaliacoes.semQuestoes")
                                      : t("avaliacoes.fechada")}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {provaAtualId &&
                (() => {
                  const idx = course.modules.findIndex((m) => m.quiz?.id === provaAtualId);
                  const m = course.modules[idx];
                  if (!m?.quiz) return null;
                  return (
                    <div className="flex flex-col gap-2" id="prova">
                      <h2 className="font-sans text-lg font-semibold text-foreground px-1 pt-2">{t("avaliacoes.provaAtual")}</h2>
                      <ModuleQuizPanel
                        moduleIndex={idx}
                        moduleTitle={m.title}
                        quiz={{
                          id: m.quiz.id,
                          title: m.quiz.title,
                          availableFrom: m.quiz.availableFrom,
                          availableUntil: m.quiz.availableUntil,
                          passingPct: m.quiz.passingPct,
                          maxAttempts: m.quiz.maxAttempts,
                          questionsPerAttempt: m.quiz.questionsPerAttempt,
                          totalQuestions: m.quiz._count.questions,
                        }}
                        previousAttempts={tentativas
                          .filter((a) => a.quizId === m.quiz!.id)
                          .map((a) => ({ score: a.score, total: a.total, passed: a.passed, createdAt: a.createdAt }))}
                      />
                      {m.quiz.practiceEnabled && <TreinoPanel quizId={m.quiz.id} moduleTitle={nomeCurto(m.title)} />}
                    </div>
                  );
                })()}

              {props.dominioTemas.length > 0 && <DominioTemas temas={props.dominioTemas} />}

              <section className="bg-surface border border-border rounded-2xl p-5">
                <h2 className="font-sans text-lg font-semibold text-foreground mb-3">{t("avaliacoes.flashcards")}</h2>
                {(() => {
                  const comCartoes = course.modules.flatMap((m) =>
                    liberado(m, agora) ? m.topics.filter((tp) => tp.flashcardGroups[0]).map((tp) => ({ m, tp })) : [],
                  );
                  if (comCartoes.length === 0) return <p className="font-sans text-sm text-muted">{t("avaliacoes.flashcardsVazio")}</p>;
                  return (
                    <ul className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3">
                      {comCartoes.map(({ m, tp }) => (
                        <li key={tp.id}>
                          <Link
                            href={`/dashboard/flashcards/${tp.flashcardGroups[0].id}`}
                            className="flex flex-col gap-0.5 h-full rounded-xl border border-border bg-background px-4 py-3 hover:border-primary/40"
                          >
                            <span className="font-sans text-xs text-muted">{nomeCurto(m.title)}</span>
                            <span className="font-sans text-[15px] font-semibold text-foreground">{tp.title}</span>
                            <span className="font-sans text-sm text-muted">
                              {t("modulo.cartoes", { count: tp.flashcardGroups[0]._count.cards })}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </section>

              {props.temJogo && <RespiratoryGameInvite slug={course.slug} />}

              <Link
                href={`${base}/resultado`}
                className="bg-surface border border-border rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-primary/40"
              >
                <BarChart2 className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                <span className="flex flex-col">
                  <span className="font-sans text-[15px] font-semibold text-foreground">{t("avaliacoes.desempenho")}</span>
                  <span className="font-sans text-sm text-muted">{t("avaliacoes.desempenhoTexto")}</span>
                </span>
              </Link>
            </>
          )}

          {/* ── Materiais ── */}
          {aba === "materiais" && (
            <div className="grid gap-4 md:grid-cols-2 items-start">
              <section className="bg-surface border border-border rounded-2xl p-5">
                <h2 className="font-sans text-lg font-semibold text-foreground mb-2">{t("materiais.apostilas")}</h2>
                {(() => {
                  const apostilas = course.modules.flatMap((m) =>
                    liberado(m, agora) ? m.topics.filter((tp) => tp.apostilaUrl).map((tp) => ({ m, tp })) : [],
                  );
                  if (apostilas.length === 0) return <p className="font-sans text-sm text-muted">{t("materiais.apostilasVazio")}</p>;
                  return (
                    <ul>
                      {apostilas.map(({ m, tp }) => (
                        <li key={tp.id} className="border-t border-border first:border-t-0">
                          <a
                            href={tp.apostilaUrl!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-3 py-3 hover:text-primary"
                          >
                            <span className="flex flex-col">
                              <span className="font-sans text-[15px] text-foreground">{tp.title}</span>
                              <span className="font-sans text-xs text-muted">{nomeCurto(m.title)}</span>
                            </span>
                            <span className="font-sans text-xs font-semibold text-primary shrink-0">PDF</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </section>

              <div className="flex flex-col gap-4">
                {props.referencias.length > 0 && (
                  <section className="bg-surface border border-border rounded-2xl p-5">
                    <h2 className="font-sans text-lg font-semibold text-foreground">
                      {t("materiais.referencias")} · {props.referencias.length}
                    </h2>
                    <p className="font-sans text-sm text-muted mb-2">{t("materiais.referenciasTexto")}</p>
                    <ul>
                      {props.referencias.map((r) => (
                        <li key={r.id} className="border-t border-border first:border-t-0">
                          <a
                            href={r.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-2 py-2.5 font-sans text-sm text-foreground hover:text-primary"
                          >
                            <BookOpen className="w-4 h-4 mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                            {r.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {(() => {
                  const comAudio = todasAulas.filter((a) => a.audioUrl).length;
                  if (comAudio === 0) return null;
                  return (
                    <section className="bg-surface border border-border rounded-2xl p-5">
                      <h2 className="font-sans text-lg font-semibold text-foreground flex items-center gap-2">
                        <Headphones className="w-5 h-5 text-primary" aria-hidden="true" />
                        {t("materiais.audios")}
                      </h2>
                      <p className="font-sans text-sm text-muted mt-1">{t("materiais.audiosTexto", { count: comAudio })}</p>
                    </section>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ── Comunidade ── */}
          {aba === "comunidade" && (
            <div className="grid gap-4 md:grid-cols-2 items-start">
              <section className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-2">
                <h2 className="font-sans text-lg font-semibold text-foreground">{t("comunidade.forum")}</h2>
                <p className="font-sans text-sm text-muted">{t("comunidade.forumTexto")}</p>
                <Link href={`${base}/forum`} className="font-sans text-sm font-semibold text-primary hover:underline w-fit">
                  {t("comunidade.abrirForum")} →
                </Link>
              </section>

              {props.whatsappUrl && (
                <section className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-2">
                  <h2 className="font-sans text-lg font-semibold text-foreground flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-green-700" aria-hidden="true" />
                    {t("comunidade.grupo")}
                  </h2>
                  <p className="font-sans text-sm text-muted">{t("comunidade.grupoTexto")}</p>
                  <a
                    href={props.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans text-sm font-semibold text-primary hover:underline w-fit"
                  >
                    {t("comunidade.entrarGrupo")} →
                  </a>
                </section>
              )}

              <section className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-2 md:col-span-2">
                <h2 className="font-sans text-lg font-semibold text-foreground">{t("comunidade.aoVivo")}</h2>
                {aoVivo ? (
                  <>
                    <p className="font-sans text-[15px] text-foreground">{aoVivo.title}</p>
                    <p className="font-sans text-sm text-muted">
                      {new Intl.DateTimeFormat(dl, { dateStyle: "full", timeStyle: "short", timeZone: FUSO }).format(aoVivo.startAt)} (
                      {t("fuso")})
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {aoVivo.meetUrl && (
                        <a
                          href={aoVivo.meetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center min-h-[44px] px-5 rounded-full bg-primary text-white font-sans text-sm font-semibold hover:bg-primary/90"
                        >
                          {t("comunidade.entrarMeet")}
                        </a>
                      )}
                      <a
                        href={aoVivo.calendarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full border border-primary/30 text-primary font-sans text-sm font-semibold hover:bg-primary/5"
                      >
                        <Calendar className="w-4 h-4" aria-hidden="true" />
                        {t("comunidade.agenda")}
                      </a>
                    </div>
                  </>
                ) : (
                  <p className="font-sans text-sm text-muted">{t("comunidade.semAoVivo")}</p>
                )}
              </section>
            </div>
          )}

          {/* ── Visão geral ── */}
          {aba === "visao-geral" && (
            <div className="grid gap-4 md:grid-cols-2 items-start">
              <section className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
                <h2 className="font-sans text-lg font-semibold text-foreground">{t("geral.certificadoTitulo")}</h2>
                <p className="font-sans text-sm text-muted">
                  {modulosComProva.length > 0 ? t("geral.certificadoRegra") : t("geral.certificadoRegraSemProva")}
                </p>

                {totalAulas > 0 && (
                  <Link
                    href={nextLesson && aulasFeitas < totalAulas ? linkAula(nextLesson.id) : linkAba("aulas")}
                    className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3.5 hover:border-primary/40"
                  >
                    <span className="flex justify-between gap-3 font-sans text-[15px]">
                      <span className="font-semibold text-foreground">{t("geral.aulas")}</span>
                      <span className="tabular-nums text-foreground">
                        {aulasFeitas} / {totalAulas}
                      </span>
                    </span>
                    <span className="h-1.5 rounded-full bg-border/60">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="flex justify-between gap-3 font-sans text-sm">
                      <span className="text-muted">
                        {aulasFeitas < totalAulas ? t("geral.faltamAulas", { count: totalAulas - aulasFeitas }) : t("geral.tudoCerto")}
                      </span>
                      {aulasFeitas < totalAulas && <span className="font-semibold text-primary">{t("geral.continuar")} →</span>}
                    </span>
                  </Link>
                )}

                {modulosComProva.length > 0 && (
                  <Link
                    href={linkAba("avaliacoes")}
                    className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3.5 hover:border-primary/40"
                  >
                    <span className="flex justify-between gap-3 font-sans text-[15px]">
                      <span className="font-semibold text-foreground">{t("geral.provas")}</span>
                      <span className="tabular-nums text-foreground">
                        {aprovadas.length} / {modulosComProva.length}
                      </span>
                    </span>
                    <span className="h-1.5 rounded-full bg-border/60">
                      <span
                        className="block h-full rounded-full bg-primary"
                        style={{ width: `${Math.round((aprovadas.length / modulosComProva.length) * 100)}%` }}
                      />
                    </span>
                    <span className="flex justify-between gap-3 font-sans text-sm">
                      <span className="text-muted">
                        {aprovadas.length < modulosComProva.length
                          ? t("geral.faltamProvas", { count: modulosComProva.length - aprovadas.length })
                          : t("geral.tudoCerto")}
                      </span>
                      {aprovadas.length < modulosComProva.length && (
                        <span className="font-semibold text-primary">{t("geral.irAsProvas")} →</span>
                      )}
                    </span>
                  </Link>
                )}

                {props.certificadoId ? (
                  <Link
                    href={`/dashboard/certificados/${props.certificadoId}`}
                    className="inline-flex items-center gap-2 font-sans text-sm font-semibold text-amber-800 hover:underline w-fit"
                  >
                    <Award className="w-4 h-4" aria-hidden="true" />
                    {t("geral.baixarCertificado")}
                  </Link>
                ) : (
                  cursoExterno && <CompleteCourseButton courseId={course.id} />
                )}
              </section>

              <div className="flex flex-col gap-4">
                <section className="bg-surface border border-border rounded-2xl p-5">
                  <h2 className="font-sans text-lg font-semibold text-foreground mb-3">{t("geral.professores")}</h2>
                  <ul className="flex flex-col gap-3">
                    {professores.map((p) => {
                      const nome = p.user.name!;
                      return (
                      <li key={p.id} className="flex items-center gap-3">
                        <span
                          className="w-9 h-9 rounded-full bg-accent/50 text-primary flex items-center justify-center font-sans text-xs font-semibold shrink-0"
                          aria-hidden="true"
                        >
                          {nome
                            .replace(/^(Dra?\.)\s*/, "")
                            .split(" ")
                            .slice(0, 2)
                            .map((p) => p[0])
                            .join("")}
                        </span>
                        <span className="flex flex-col">
                          <span className="font-sans text-[15px] font-semibold text-foreground">{nome}</span>
                          {p.title && <span className="font-sans text-sm text-muted">{p.title}</span>}
                        </span>
                      </li>
                      );
                    })}
                  </ul>
                </section>

                {course.shortDesc && <p className="font-sans text-sm text-muted px-1 leading-relaxed">{course.shortDesc}</p>}

                <div className="flex flex-wrap gap-x-5 gap-y-2 px-1">
                  <Link href={`${base}/avaliacao`} className="inline-flex items-center gap-1.5 font-sans text-sm text-primary hover:underline">
                    <Star className="w-4 h-4" aria-hidden="true" />
                    {t("geral.avaliar")}
                  </Link>
                  <Link
                    href={`/cursos/${course.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 font-sans text-sm text-muted hover:text-foreground"
                  >
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    {t("geral.paginaPublica")}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
