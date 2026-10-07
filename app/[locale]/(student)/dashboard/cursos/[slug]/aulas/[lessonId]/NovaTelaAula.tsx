"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import MuxPlayer from "@mux/mux-player-react";
import { Award, BookOpen, Check, ChevronLeft, FileDown, Link2, ListVideo, PlayCircle, X } from "lucide-react";
import { saveNote } from "../../noteActions";
import QuizPanel from "../../QuizPanel";
import CommentSection from "../../CommentSection";
import { LessonFeedbackBar } from "./LessonFeedbackBar";
import { ConviteAvaliacao } from "./ConviteAvaliacao";

/**
 * Tela de aula da nova área do aluno (redesenho de outubro/2026).
 *
 * Aparece no lugar do LessonPlayerClient quando a chave em
 * /admin/configuracoes/area-do-aluno libera para esta pessoa. Mesmos dados
 * e mesmas ações (progresso, anotações, quiz, comentários, joinha); muda a
 * organização: o essencial fica em cima (conteúdo, título e o botão de
 * concluir e seguir) e o resto vai para quatro abas.
 */

type Aula = {
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  type: string;
  videoUrl: string | null;
  audioUrl: string | null;
  muxPlaybackId: string | null;
  instructors?: { instructor: { user: { name: string | null } } }[];
};

type Topico = { id: string; title: string; apostilaUrl?: string | null; lessons: Aula[] };
type Modulo = { id: string; title: string; releaseDate: Date | string | null; topics: Topico[] };
type QuizDaAula = {
  id: string;
  title: string;
  questions: { id: string; text: string; order: number; options: { id: string; text: string; order: number }[] }[];
};

type Props = {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  modules: Modulo[];
  currentLessonId: string;
  initialProgress: Record<string, boolean>;
  initialNote: string;
  quiz: QuizDaAula | null;
  previousAttempt: { score: number; total: number } | null;
  initialCertificateId: string | null;
  currentUserId: string;
  currentUserRole: string;
  currentUserName: string | null;
  referencias: { id: string; title: string; fileUrl: string }[];
  feedbackAtual: { useful: boolean; suggestion: string | null } | null;
  jaAvaliouCurso: boolean;
};

const ABAS = ["resumo", "materiais", "anotacoes", "discussao"] as const;
type Aba = (typeof ABAS)[number];

function bloqueado(m: Modulo) {
  return !!m.releaseDate && new Date(m.releaseDate) > new Date();
}

function fmtDuracao(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

function idYoutube(url: string): string | null {
  for (const p of [/youtu\.be\/([^?&]+)/, /youtube\.com\/watch\?v=([^&]+)/, /youtube\.com\/embed\/([^?&]+)/]) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function tipoDaAula(a: Aula): "video" | "audio" | "aoVivo" | "gravacao" | "leitura" | "emBreve" {
  const temVideo = !!(a.muxPlaybackId || a.videoUrl);
  const aoVivo = a.type === "LIVE" || /encontro s[ií]ncrono/i.test(a.title);
  if (aoVivo) return temVideo ? "gravacao" : "aoVivo";
  if (temVideo) return "video";
  if (a.audioUrl) return "audio";
  if (a.type === "TEXT") return "leitura";
  return "emBreve";
}

export default function NovaTelaAula(props: Props) {
  const { courseId, courseSlug, courseTitle, modules, currentLessonId, quiz } = props;
  const t = useTranslations("novaArea.aula");
  const tc = useTranslations("novaArea.curso");
  const router = useRouter();
  const [pendente, startTransition] = useTransition();

  const [progresso, setProgresso] = useState(props.initialProgress);
  const [certificadoId, setCertificadoId] = useState(props.initialCertificateId);
  const [comemorar, setComemorar] = useState(false);
  const [aba, setAba] = useState<Aba>("resumo");
  const [indiceAberto, setIndiceAberto] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);

  // ── Aula atual, vizinhas e números ──
  const liberadas = modules.filter((m) => !bloqueado(m)).flatMap((m) => m.topics.flatMap((tp) => tp.lessons));
  const idx = liberadas.findIndex((a) => a.id === currentLessonId);
  const aula = idx >= 0 ? liberadas[idx] : null;
  const anterior = idx > 0 ? liberadas[idx - 1] : null;
  const proxima = idx >= 0 && idx < liberadas.length - 1 ? liberadas[idx + 1] : null;
  const modulo = modules.find((m) => m.topics.some((tp) => tp.lessons.some((a) => a.id === currentLessonId)));
  const topico = modulo?.topics.find((tp) => tp.lessons.some((a) => a.id === currentLessonId));

  // Mesmo número da página do curso: todas as aulas, inclusive as de módulos
  // ainda fechados, porque é esse total que vale para o certificado.
  const todas = modules.flatMap((m) => m.topics.flatMap((tp) => tp.lessons));
  const feitas = todas.filter((a) => progresso[a.id]).length;
  const pct = todas.length ? Math.round((feitas / todas.length) * 100) : 0;
  const concluida = !!progresso[currentLessonId];

  const aulasDoModulo = modulo?.topics.flatMap((tp) => tp.lessons) ?? [];
  const moduloConcluido = aulasDoModulo.length > 0 && aulasDoModulo.every((a) => progresso[a.id]);

  const temMux = !!aula?.muxPlaybackId;
  const youtube = !temMux && aula?.videoUrl ? idYoutube(aula.videoUrl) : null;
  const temVideo = temMux || !!youtube;
  const temAudio = !!aula?.audioUrl;
  const [modo, setModo] = useState<"assistir" | "ouvir">(temVideo ? "assistir" : "ouvir");

  const linkAula = (id: string) => `/dashboard/cursos/${courseSlug}/aulas/${id}`;

  // ── Anotações (salvam sozinhas, 1,5 s depois de parar de digitar) ──
  const [nota, setNota] = useState(props.initialNote);
  const [statusNota, setStatusNota] = useState<"" | "salvando" | "salvo">("");
  const timerNota = useRef<ReturnType<typeof setTimeout> | null>(null);
  function mudarNota(valor: string) {
    setNota(valor);
    setStatusNota("");
    if (timerNota.current) clearTimeout(timerNota.current);
    timerNota.current = setTimeout(async () => {
      setStatusNota("salvando");
      await saveNote(currentLessonId, valor);
      setStatusNota("salvo");
    }, 1500);
  }

  function marcar(completa: boolean, seguir: boolean) {
    startTransition(async () => {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: currentLessonId, courseId, completed: completa }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setProgresso((p) => ({ ...p, [currentLessonId]: completa }));
      if (data.courseCompleted && data.certificateId) {
        setCertificadoId(data.certificateId);
        setComemorar(true);
        return;
      }
      if (completa && seguir && proxima) router.push(linkAula(proxima.id));
    });
  }

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      window.prompt(t("copieOLink"), window.location.href);
      return;
    }
    setLinkCopiado(true);
    setTimeout(() => setLinkCopiado(false), 2000);
  }

  if (comemorar) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
        <div role="dialog" aria-modal="true" className="w-full max-w-lg bg-surface rounded-3xl p-8 text-center flex flex-col items-center gap-3">
          <span className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
            <Award className="w-10 h-10 text-amber-800" aria-hidden="true" />
          </span>
          <h2 className="font-serif text-3xl font-medium text-foreground">{t("parabens")}</h2>
          <p className="font-sans text-[15px] text-muted">
            {t("parabensTexto")} <strong className="text-foreground">{courseTitle}</strong>
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-3">
            {certificadoId && (
              <a
                href={`/api/certificates/${certificadoId}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 min-h-[48px] px-6 rounded-full bg-primary text-white font-sans text-sm font-semibold"
              >
                <Award className="w-4 h-4" aria-hidden="true" />
                {t("baixarCertificado")}
              </a>
            )}
            <button
              type="button"
              onClick={() => setComemorar(false)}
              className="min-h-[48px] px-6 rounded-full border border-border font-sans text-sm text-foreground"
            >
              {t("continuarNoCurso")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const indice = modulo && (
    <nav aria-label={t("indice")} className="flex flex-col">
      <div className="px-2 pb-3 flex flex-col">
        <span className="font-sans text-[15px] font-semibold text-foreground">{modulo.title}</span>
        <span className="font-sans text-sm text-muted">
          {tc("modulo.progresso", {
            feitas: aulasDoModulo.filter((a) => progresso[a.id]).length,
            total: aulasDoModulo.length,
          })}
        </span>
      </div>
      {modulo.topics.map((tp) => (
        <div key={tp.id} className="border-t border-border pt-2 mt-1">
          <p className="px-2 py-1.5 font-sans text-xs font-semibold uppercase tracking-wider text-muted">{tp.title}</p>
          <ul>
            {tp.lessons.map((a) => {
              const atual = a.id === currentLessonId;
              const feita = !!progresso[a.id];
              return (
                <li key={a.id}>
                  <Link
                    href={linkAula(a.id)}
                    aria-current={atual ? "page" : undefined}
                    className={`flex items-center gap-2.5 px-2 py-2 min-h-[44px] rounded-lg ${atual ? "bg-accent/50" : "hover:bg-background"}`}
                  >
                    {feita ? (
                      <span className="w-5 h-5 rounded-full bg-green-700 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" strokeWidth={3} aria-label={tc("modulo.concluido")} />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border-[1.5px] border-border shrink-0" aria-hidden="true" />
                    )}
                    <span className={`flex-1 min-w-0 font-sans text-sm text-foreground ${atual ? "font-semibold" : ""}`}>
                      {a.title.trim()}
                    </span>
                    {a.duration ? <span className="font-sans text-xs text-muted shrink-0 tabular-nums">{a.duration} min</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <Link
        href={`/dashboard/cursos/${courseSlug}?aba=aulas`}
        className="mt-3 px-2 font-sans text-sm font-semibold text-primary hover:underline"
      >
        {t("verTodos")} →
      </Link>
    </nav>
  );

  const professores = (aula?.instructors ?? []).map((i) => i.instructor.user.name).filter(Boolean).join(" · ");
  const tipo = aula ? tipoDaAula(aula) : "video";

  return (
    <div className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8 min-h-screen bg-background">
      {/* ── Barra do topo ── */}
      <header className="bg-surface border-b border-border px-4 sm:px-6">
        <div className="max-w-[88rem] mx-auto min-h-[60px] flex flex-wrap items-center justify-between gap-x-5 gap-y-1">
          <Link
            href={`/dashboard/cursos/${courseSlug}`}
            className="inline-flex items-center gap-1.5 min-h-[44px] font-sans text-sm font-semibold text-primary"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            {t("voltar")}
          </Link>
          {modulo && (
            <p className="hidden md:block flex-1 min-w-0 truncate font-sans text-sm text-muted">
              {modulo.title.split("—")[0].trim()}
              {topico && ` · ${topico.title}`}
            </p>
          )}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2.5 font-sans text-sm text-muted">
              <span>{t("progresso", { feitas, total: todas.length })}</span>
              <span className="w-28 h-1.5 rounded-full bg-border/70">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </span>
              <span className="tabular-nums">{pct}%</span>
            </div>
            <button
              type="button"
              onClick={() => setIndiceAberto((v) => !v)}
              aria-expanded={indiceAberto}
              className="lg:hidden inline-flex items-center gap-1.5 min-h-[44px] px-3 font-sans text-sm font-semibold text-primary"
            >
              <ListVideo className="w-4 h-4" aria-hidden="true" />
              {t("aulas")}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[88rem] mx-auto px-4 sm:px-6 py-6 flex flex-wrap gap-7 items-start">
        {/* ── Coluna principal ── */}
        <main className="flex-[999_1_36rem] min-w-0 flex flex-col gap-5">
          {indiceAberto && (
            <div className="lg:hidden bg-surface border border-border rounded-2xl p-3 relative">
              <button
                type="button"
                onClick={() => setIndiceAberto(false)}
                aria-label={t("fecharIndice")}
                className="absolute right-2 top-2 w-11 h-11 flex items-center justify-center text-muted"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
              {indice}
            </div>
          )}

          {temVideo && temAudio && (
            <div role="group" aria-label={t("formato")} className="inline-flex self-start bg-surface border border-border rounded-full p-1">
              {(["assistir", "ouvir"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={modo === m}
                  onClick={() => setModo(m)}
                  className={`min-h-[40px] px-5 rounded-full font-sans text-sm ${
                    modo === m ? "bg-primary text-white font-semibold" : "text-muted hover:text-foreground"
                  }`}
                >
                  {t(m)}
                </button>
              ))}
            </div>
          )}

          {modo === "assistir" || !temAudio ? (
            <div className="aspect-video w-full bg-canvas rounded-2xl overflow-hidden">
              {temMux ? (
                <MuxPlayer
                  key={aula!.muxPlaybackId!}
                  playbackId={aula!.muxPlaybackId!}
                  streamType="on-demand"
                  style={{ height: "100%", width: "100%" }}
                  accentColor="#00475E"
                  onEnded={() => {
                    if (!progresso[currentLessonId]) marcar(true, false);
                  }}
                />
              ) : youtube ? (
                <iframe
                  key={youtube}
                  src={`https://www.youtube.com/embed/${youtube}?rel=0&modestbranding=1`}
                  title={aula?.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/70 text-center px-6">
                  <PlayCircle className="w-10 h-10" aria-hidden="true" />
                  <p className="font-sans text-[15px] font-semibold text-white">{t("playerProtegido")}</p>
                  <p className="font-sans text-sm">{t("playerProtegidoTexto")}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-canvas rounded-2xl px-5 sm:px-7 py-6 flex flex-col gap-3">
              <p className="font-sans text-sm font-semibold text-accent">{t("audioTitulo")}</p>
              {/* Sem altura forçada: o player nativo precisa de 54px e o Chrome
                  corta os controles quando recebe menos. */}
              <audio
                key={aula!.id}
                controls
                preload="metadata"
                src={`/api/audiocast/${aula!.id}`}
                className="w-full"
                style={{ accentColor: "#00475E" }}
                onEnded={() => {
                  if (!progresso[currentLessonId]) marcar(true, false);
                }}
              />
            </div>
          )}

          {(temVideo || temAudio) && <p className="font-sans text-xs text-muted">{t("direitos")}</p>}

          <div className="flex flex-col gap-1.5">
            <h1 className="font-serif text-3xl lg:text-4xl font-medium text-foreground leading-tight text-balance">
              {aula?.title.trim()}
            </h1>
            <p className="font-sans text-sm text-muted flex flex-wrap gap-x-4 gap-y-1">
              {professores && <span>{professores}</span>}
              <span>
                {tc(`tipo.${tipo}`)}
                {aula?.duration ? ` · ${fmtDuracao(aula.duration)}` : ""}
              </span>
            </p>
          </div>

          {/* ── Ação principal ── */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            {!concluida ? (
              <button
                type="button"
                onClick={() => marcar(true, true)}
                disabled={pendente}
                className="inline-flex items-center gap-2 min-h-[48px] px-6 rounded-full bg-primary text-white font-sans text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
              >
                {proxima ? `${t("concluirProxima")} →` : t("concluir")}
              </button>
            ) : (
              <>
                {proxima && (
                  <Link
                    href={linkAula(proxima.id)}
                    className="inline-flex items-center gap-2 min-h-[48px] px-6 rounded-full bg-primary text-white font-sans text-sm font-semibold hover:bg-primary/90"
                  >
                    {t("proxima")} →
                  </Link>
                )}
                <span className="inline-flex items-center gap-2 font-sans text-sm text-green-800">
                  <Check className="w-4 h-4" strokeWidth={3} aria-hidden="true" />
                  {t("concluida")}
                  <button
                    type="button"
                    onClick={() => marcar(false, false)}
                    disabled={pendente}
                    className="text-muted underline hover:text-foreground min-h-[44px] px-1"
                  >
                    {t("desmarcar")}
                  </button>
                </span>
              </>
            )}
            {proxima && !concluida && (
              <span className="font-sans text-sm text-muted">{t("aSeguir", { titulo: proxima.title.trim() })}</span>
            )}
            <span className="flex items-center gap-1 ml-auto">
              {anterior && (
                <Link
                  href={linkAula(anterior.id)}
                  className="inline-flex items-center min-h-[44px] px-3 font-sans text-sm text-muted hover:text-foreground"
                >
                  ← {t("anterior")}
                </Link>
              )}
              <button
                type="button"
                onClick={copiarLink}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-3 font-sans text-sm text-muted hover:text-foreground"
              >
                {linkCopiado ? <Check className="w-4 h-4" aria-hidden="true" /> : <Link2 className="w-4 h-4" aria-hidden="true" />}
                {linkCopiado ? t("linkCopiado") : t("copiarLink")}
              </button>
            </span>
          </div>

          {moduloConcluido && !props.jaAvaliouCurso && modulo && (
            <ConviteAvaliacao courseSlug={courseSlug} moduloTitulo={modulo.title} />
          )}

          {/* ── Abas ── */}
          <section className="bg-surface border border-border rounded-2xl">
            <div role="tablist" aria-label={t("secoes")} className="flex flex-wrap gap-1 px-3 pt-1.5 border-b border-border">
              {ABAS.map((a) => (
                <button
                  key={a}
                  type="button"
                  role="tab"
                  id={`aba-${a}`}
                  aria-selected={aba === a}
                  aria-controls={`painel-${a}`}
                  onClick={() => setAba(a)}
                  className={`min-h-[46px] px-3.5 -mb-px border-b-2 font-sans text-[15px] ${
                    aba === a ? "border-primary text-primary font-semibold" : "border-transparent text-muted hover:text-foreground"
                  }`}
                >
                  {t(`abas.${a}`)}
                </button>
              ))}
            </div>

            <div role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`} className="p-5 sm:p-6">
              {aba === "resumo" && (
                <div className="flex flex-col gap-5 max-w-[68ch]">
                  {aula?.description ? (
                    <p className="font-sans text-[15px] text-foreground leading-relaxed whitespace-pre-line">{aula.description}</p>
                  ) : (
                    <p className="font-sans text-sm text-muted">{t("semResumo")}</p>
                  )}
                  <LessonFeedbackBar lessonId={currentLessonId} inicial={props.feedbackAtual} />
                  {quiz && <QuizPanel key={currentLessonId} quiz={quiz} previousAttempt={props.previousAttempt} />}
                </div>
              )}

              {aba === "materiais" && (
                <ul className="flex flex-col">
                  {topico?.apostilaUrl && (
                    <li className="border-b border-border">
                      <a
                        href={topico.apostilaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 py-3 hover:text-primary"
                      >
                        <span className="flex items-center gap-2.5 font-sans text-[15px] text-foreground">
                          <FileDown className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                          {t("apostila")} · {topico.title}
                        </span>
                        <span className="font-sans text-xs font-semibold text-primary">PDF</span>
                      </a>
                    </li>
                  )}
                  {props.referencias.length > 0 && (
                    <li className="pt-4">
                      <p className="font-sans text-sm font-semibold text-foreground mb-1">
                        {t("referencias")} · {props.referencias.length}
                      </p>
                      <ul>
                        {props.referencias.map((r) => (
                          <li key={r.id}>
                            <a
                              href={r.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-2 py-2 font-sans text-sm text-foreground hover:text-primary"
                            >
                              <BookOpen className="w-4 h-4 mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                              {r.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </li>
                  )}
                  {!topico?.apostilaUrl && props.referencias.length === 0 && (
                    <li className="font-sans text-sm text-muted">{t("semMateriais")}</li>
                  )}
                </ul>
              )}

              {aba === "anotacoes" && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="nota-aula" className="font-sans text-sm font-semibold text-foreground">
                    {t("suasAnotacoes")}
                  </label>
                  <textarea
                    id="nota-aula"
                    value={nota}
                    onChange={(e) => mudarNota(e.target.value)}
                    rows={7}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 font-sans text-[15px] text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="font-sans text-xs text-muted" aria-live="polite">
                    {statusNota === "salvando" ? t("salvando") : statusNota === "salvo" ? t("salvo") : t("anotacoesAjuda")}
                  </p>
                </div>
              )}

              {aba === "discussao" && (
                <CommentSection
                  lessonId={currentLessonId}
                  currentUserId={props.currentUserId}
                  currentUserRole={props.currentUserRole}
                  currentUserName={props.currentUserName}
                />
              )}
            </div>
          </section>
        </main>

        {/* ── Índice do módulo (computador) ── */}
        <aside className="hidden lg:block flex-[1_1_20rem] min-w-0 max-w-sm bg-surface border border-border rounded-2xl p-3 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
          {indice}
        </aside>
      </div>
    </div>
  );
}
