"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import MuxPlayer from "@mux/mux-player-react";
import { CheckCircle, Circle, PlayCircle, ChevronDown, ChevronRight, NotebookPen, Check, Lock, Award, Star, FileDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { saveNote } from "./noteActions";
import QuizPanel from "./QuizPanel";
import CommentSection from "./CommentSection";

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  videoUrl: string | null;
  audioUrl: string | null;
  muxPlaybackId: string | null;
  isFree: boolean;
  order: number;
  instructors?: { instructor: { user: { name: string | null } } }[];
};

type Topic = {
  id: string;
  title: string;
  order: number;
  apostilaUrl?: string | null;
  lessons: Lesson[];
};

type Module = {
  id: string;
  title: string;
  order: number;
  releaseDate: Date | string | null;
  topics: Topic[];
  instructors?: { instructor: { user: { name: string | null } } }[];
};

type ProgressMap = Record<string, boolean>;

type QuizOption = {
  id: string;
  text: string;
  order: number;
};

type QuizQuestion = {
  id: string;
  text: string;
  order: number;
  options: QuizOption[];
};

type QuizData = {
  id: string;
  title: string;
  questions: QuizQuestion[];
};

type CourseRef = { id: string; title: string; fileUrl: string; fileSize: number | null };

type Props = {
  courseId: string;
  courseTitle: string;
  modules: Module[];
  initialProgress: ProgressMap;
  initialLessonId: string | null;
  initialNotes: Record<string, string>;
  quizzes: Record<string, QuizData>;
  previousAttempts: Record<string, { score: number; total: number }>;
  initialCertificateId: string | null;
  currentUserId: string;
  currentUserRole: string;
  currentUserName: string | null;
  courseReferences?: CourseRef[];
};

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}min`;
  return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}min` : ""}`;
}

function isModuleLocked(mod: Module): boolean {
  if (!mod.releaseDate) return false;
  return new Date(mod.releaseDate) > new Date();
}

function formatReleaseDate(releaseDate: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(releaseDate));
}

export default function LessonPlayer({ courseId, courseTitle, modules, initialProgress, initialLessonId, initialNotes, quizzes, previousAttempts, initialCertificateId, currentUserId, currentUserRole, currentUserName, courseReferences = [] }: Props) {
  const t = useTranslations("dashboard.courses");
  const router = useRouter();

  const allLessons = modules.flatMap((m) => isModuleLocked(m) ? [] : m.topics.flatMap((t) => t.lessons));
  const firstLesson = allLessons[0] ?? null;
  const requestedLesson = initialLessonId ? modules.flatMap((m) => m.topics.flatMap((t) => t.lessons)).find((l) => l.id === initialLessonId) ?? null : null;
  const requestedModule = requestedLesson ? modules.find((m) => m.topics.some((t) => t.lessons.some((l) => l.id === requestedLesson.id))) : null;
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(
    requestedLesson && requestedModule && !isModuleLocked(requestedModule) ? requestedLesson : firstLesson
  );
  const [progress, setProgress] = useState<ProgressMap>(initialProgress);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    modules.forEach((m, i) => { initial[m.id] = i === 0; });
    return initial;
  });
  const [isPending, startTransition] = useTransition();
  const [certificateId, setCertificateId] = useState<string | null>(initialCertificateId);
  const [showCelebration, setShowCelebration] = useState(false);

  // ── Notepad ──────────────────────────────────────────────────────────────
  const [notes, setNotes] = useState<Record<string, string>>(initialNotes);
  const [noteContent, setNoteContent] = useState(
    initialNotes[initialLessonId ?? allLessons[0]?.id ?? ""] ?? ""
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore note when switching lessons
  useEffect(() => {
    setNoteContent(notes[currentLesson?.id ?? ""] ?? "");
    setSaveStatus("idle");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLesson?.id]);

  function handleNoteChange(value: string) {
    if (!currentLesson) return;
    setNoteContent(value);
    setNotes((prev) => ({ ...prev, [currentLesson.id]: value }));
    setSaveStatus("idle");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      await saveNote(currentLesson.id, value);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 1500);
  }

  const completedCount = Object.values(progress).filter(Boolean).length;
  const totalCount = allLessons.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  function toggleModule(moduleId: string) {
    setOpenModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  }

  function handleMarkComplete(lesson: Lesson, completed: boolean) {
    startTransition(async () => {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id, courseId, completed }),
      });
      if (res.ok) {
        const data = await res.json();
        setProgress((prev) => ({ ...prev, [lesson.id]: completed }));
        if (data.courseCompleted && data.certificateId) {
          setCertificateId(data.certificateId);
          setShowCelebration(true);
          return;
        }
        if (completed) {
          const idx = allLessons.findIndex((l) => l.id === lesson.id);
          if (idx !== -1 && idx < allLessons.length - 1) {
            setCurrentLesson(allLessons[idx + 1]);
            const nextLesson = allLessons[idx + 1];
            const nextModule = modules.find((m) => m.topics.some((t) => t.lessons.some((l) => l.id === nextLesson.id)));
            if (nextModule) setOpenModules((prev) => ({ ...prev, [nextModule.id]: true }));
          }
        }
      }
    });
  }

  const currentIndex = currentLesson ? allLessons.findIndex((l) => l.id === currentLesson.id) : -1;
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Decide qual player usar: Mux tem prioridade sobre YouTube
  const hasMux = Boolean(currentLesson?.muxPlaybackId);
  const youtubeId = !hasMux && currentLesson?.videoUrl ? extractYoutubeId(currentLesson.videoUrl) : null;

  if (showCelebration) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
        <div className="relative w-full max-w-lg bg-surface border border-border rounded-3xl p-8 text-center shadow-2xl">
          {/* Stars decoration */}
          <div className="flex justify-center gap-1 mb-4">
            {[0,1,2,3,4].map((i) => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
          </div>

          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
            <Award className="w-10 h-10 text-primary" />
          </div>

          <h2 className="font-serif text-2xl font-medium text-foreground mb-2">
            Parabéns! Curso concluído.
          </h2>
          <p className="font-sans text-sm text-muted mb-1">
            Você completou todas as aulas de
          </p>
          <p className="font-sans text-sm font-semibold text-foreground mb-6">
            {courseTitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {certificateId && (
              <a
                href={`/api/certificates/${certificateId}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 font-sans text-sm font-semibold px-6 py-3 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                <Award className="w-4 h-4" />
                Baixar certificado
              </a>
            )}
            <button
              onClick={() => setShowCelebration(false)}
              className="inline-flex items-center justify-center font-sans text-sm text-muted hover:text-foreground px-6 py-3 rounded-full border border-border transition-colors"
            >
              Continuar no curso
            </button>
          </div>

          {certificateId && (
            <p className="font-sans text-[10px] text-muted mt-5">
              Seu certificado também está disponível em{" "}
              <button onClick={() => router.push("/dashboard/certificados")} className="underline hover:no-underline">
                Meus certificados
              </button>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-4rem)]">
      {/* ── Player principal ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Video */}
        <div className="bg-black aspect-video w-full">
          {hasMux ? (
            <MuxPlayer
              key={currentLesson!.muxPlaybackId!}
              playbackId={currentLesson!.muxPlaybackId!}
              streamType="on-demand"
              style={{ height: "100%", width: "100%" }}
              accentColor="#00a3c4"
              onEnded={() => {
                if (currentLesson && !progress[currentLesson.id]) {
                  handleMarkComplete(currentLesson, true);
                }
              }}
            />
          ) : youtubeId ? (
            <iframe
              key={youtubeId}
              src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
              title={currentLesson?.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/40">
              <PlayCircle className="w-16 h-16" />
              <p className="font-sans text-sm">{t("videoComingSoon")}</p>
            </div>
          )}
        </div>

        {/* AudioCast */}
        {currentLesson?.audioUrl && (
          <div className="bg-[#0a1f27] border-b border-border px-4 py-3 flex items-center gap-3">
            <span className="text-[#00a3c4] shrink-0 text-lg">🎙</span>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-[11px] font-bold uppercase tracking-widest text-[#00a3c4] mb-1">AudioCast</p>
              <audio
                controls
                src={currentLesson.audioUrl}
                className="w-full h-8"
                style={{ accentColor: "#00a3c4" }}
              />
            </div>
          </div>
        )}

        {/* Aviso de direitos autorais — exibido apenas para cursos com vídeo */}
        {(hasMux || youtubeId) && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-start gap-2">
            <span className="text-amber-600 text-xs mt-0.5 shrink-0">⚠</span>
            <p className="font-sans text-[11px] text-amber-800 leading-relaxed">
              É proibida a reprodução total ou parcial das aulas por qualquer meio ou processo, inclusive quanto às características gráficas e/ou editoriais. A violação de direitos autorais constitui crime (Código Penal, art. 184 e Lei nº 9.610/98), sujeitando-se à busca e apreensão e indenizações diversas.
            </p>
          </div>
        )}

        {/* Info da aula */}
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              {(() => {
                const mod = modules.find((m) => m.topics.some((t) => t.lessons.some((l) => l.id === currentLesson?.id)));
                const topic = mod?.topics.find((t) => t.lessons.some((l) => l.id === currentLesson?.id));
                const lessonInstructors = currentLesson?.instructors ?? [];
                return mod ? (
                  <div className="mb-1">
                    <p className="font-sans text-xs text-muted">
                      {mod.title}{topic ? <span className="text-muted/60"> › {topic.title}</span> : null}
                    </p>
                    {lessonInstructors.length > 0 && (
                      <p className="font-sans text-xs text-primary/80 font-medium">
                        {lessonInstructors.map((li) => li.instructor.user.name).filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                ) : null;
              })()}
              <h1 className="font-serif text-xl font-medium text-foreground">
                {currentLesson?.title ?? t("selectLesson")}
              </h1>
            </div>
            {currentLesson && (
              <button
                onClick={() => handleMarkComplete(currentLesson, !progress[currentLesson.id])}
                disabled={isPending}
                className={`flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2 rounded-full border transition-all shrink-0 ${
                  progress[currentLesson.id]
                    ? "bg-green-500/10 border-green-500/30 text-green-600"
                    : "border-primary text-primary hover:bg-primary hover:text-white"
                }`}
              >
                {progress[currentLesson.id] ? (
                  <><CheckCircle className="w-4 h-4" /> {t("lessonDone")}</>
                ) : (
                  <><Circle className="w-4 h-4" /> {t("markComplete")}</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Descrição da aula */}
        {currentLesson?.description && (
          <div className="px-6 py-4 border-b border-border">
            <p className="font-sans text-sm text-muted leading-relaxed whitespace-pre-line">
              {currentLesson.description}
            </p>
          </div>
        )}

        {/* Navegação entre aulas */}
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={() => prevLesson && setCurrentLesson(prevLesson)}
            disabled={!prevLesson}
            className="flex items-center gap-2 font-sans text-sm text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronDown className="w-4 h-4 rotate-90" />
            {t("previous")}
          </button>

          <div className="text-center">
            <p className="font-sans text-xs text-muted">{pct}{t("percentCompleted")}</p>
            <div className="w-32 h-1.5 bg-border rounded-full overflow-hidden mt-1">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <button
            onClick={() => nextLesson && setCurrentLesson(nextLesson)}
            disabled={!nextLesson}
            className="flex items-center gap-2 font-sans text-sm text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {t("next")}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── Quiz ── */}
        {currentLesson && quizzes[currentLesson.id] && (
          <QuizPanel
            key={currentLesson.id}
            quiz={quizzes[currentLesson.id]}
            previousAttempt={previousAttempts[quizzes[currentLesson.id].id] ?? null}
          />
        )}

        {/* ── Bloco de notas ── */}
        {currentLesson && (
          <div className="px-6 pb-6">
            <div className="border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
                <div className="flex items-center gap-2">
                  <NotebookPen className="w-3.5 h-3.5 text-muted" />
                  <span className="font-sans text-xs font-semibold text-muted uppercase tracking-wider">
                    {t("notes")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {saveStatus === "saving" && (
                    <span className="font-sans text-[10px] text-muted animate-pulse">{t("notesSaving")}</span>
                  )}
                  {saveStatus === "saved" && (
                    <span className="flex items-center gap-1 font-sans text-[10px] text-green-600">
                      <Check className="w-3 h-3" />
                      {t("notesSaved")}
                    </span>
                  )}
                </div>
              </div>
              <textarea
                value={noteContent}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder={t("notesPlaceholder")}
                rows={5}
                className="w-full px-4 py-3 font-sans text-sm text-foreground bg-surface placeholder:text-muted/40 resize-none focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* ── Comentários ── */}
        {currentLesson && (
          <CommentSection
            lessonId={currentLesson.id}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            currentUserName={currentUserName}
          />
        )}

        {/* ── AudioCasts — cards estilo Netflix ── */}
        {(() => {
          const allAudiocasts = modules.flatMap((m) =>
            m.topics.flatMap((t) => t.lessons.filter((l) => l.audioUrl))
          );
          if (allAudiocasts.length === 0) return null;

          const palettes = [
            { from: "#0d2d3d", to: "#00a3c4" },
            { from: "#1a0d2d", to: "#7c3aed" },
            { from: "#0d2018", to: "#059669" },
            { from: "#2d1a0d", to: "#d97706" },
            { from: "#1e0d1a", to: "#db2777" },
          ];

          const waveHeights = [4, 9, 18, 26, 14, 22, 9, 16, 22, 7, 20, 11, 24, 8, 17, 5, 13, 21, 9, 17];

          return (
            <div className="border-t border-border">
              <div className="px-6 pt-6 pb-2">
                <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">AudioCasts</p>
              </div>
              <div
                className="flex gap-3 px-6 pb-6 overflow-x-auto"
                style={{ scrollbarWidth: "thin", scrollbarColor: "var(--color-border) transparent" }}
              >
                {allAudiocasts.map((lesson, i) => {
                  const pal = palettes[i % palettes.length];
                  const isPlaying = currentLesson?.id === lesson.id;
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setCurrentLesson(lesson)}
                      className="shrink-0 relative w-36 h-52 rounded-xl overflow-hidden group focus:outline-none"
                      style={{
                        transform: isPlaying ? "scale(1.04)" : undefined,
                        boxShadow: isPlaying ? `0 0 0 2px #00a3c4, 0 8px 24px rgba(0,163,196,0.35)` : undefined,
                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      }}
                    >
                      {/* background gradient */}
                      <div
                        className="absolute inset-0 transition-transform duration-300 group-hover:scale-105"
                        style={{ background: `linear-gradient(135deg, ${pal.from} 0%, ${pal.to}80 100%)` }}
                      />

                      {/* waveform decoration */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-35 transition-opacity duration-300">
                        <svg viewBox="0 0 82 42" className="w-28 h-14" fill="none">
                          {waveHeights.map((h, j) => (
                            <rect
                              key={j}
                              x={j * 4 + 1}
                              y={(42 - h) / 2}
                              width="2.5"
                              height={h}
                              rx="1.25"
                              fill="white"
                            />
                          ))}
                        </svg>
                      </div>

                      {/* AUDIOCAST pill */}
                      <div className="absolute top-2.5 left-2.5">
                        <span
                          className="font-sans text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                          style={{ background: pal.to, color: "white" }}
                        >
                          AudioCast
                        </span>
                      </div>

                      {/* playing indicator */}
                      {isPlaying && (
                        <div className="absolute top-2.5 right-2.5">
                          <PlayCircle className="w-3.5 h-3.5 text-white drop-shadow" />
                        </div>
                      )}

                      {/* bottom text */}
                      <div className="absolute inset-x-0 bottom-0 px-2.5 py-2.5"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 60%, transparent)" }}>
                        <p className="font-sans text-[11px] font-semibold text-white leading-tight line-clamp-3">
                          {lesson.title}
                        </p>
                        {lesson.duration && (
                          <p className="font-sans text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                            {formatDuration(lesson.duration)}
                          </p>
                        )}
                      </div>

                      {/* hover overlay */}
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-200" />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── Apostilas ── */}
        {(() => {
          const apostilas = modules
            .filter((m) => !isModuleLocked(m))
            .flatMap((m) =>
              m.topics
                .filter((t) => t.apostilaUrl)
                .map((t) => ({ title: t.title, url: t.apostilaUrl! }))
            );
          if (apostilas.length === 0) return null;
          return (
            <div className="border-t border-border">
              <div className="px-6 pt-6 pb-2">
                <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">Apostilas</p>
              </div>
              <div className="flex gap-3 px-6 pb-6 overflow-x-auto">
                {apostilas.map((ap, i) => (
                  <a
                    key={i}
                    href={ap.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 relative w-36 h-52 rounded-xl overflow-hidden group"
                    style={{ background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)" }}
                  >
                    <div className="absolute inset-0 flex flex-col items-end justify-end p-3 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                      <p className="font-sans text-[11px] font-semibold text-white leading-tight line-clamp-3 w-full">
                        {ap.title}
                      </p>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity">
                      <svg viewBox="0 0 24 24" className="w-14 h-14" fill="none" stroke="white" strokeWidth="1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                    </div>
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                      <span className="font-sans text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/15 text-white/80">
                        Apostila
                      </span>
                    </div>
                    <div className="absolute bottom-10 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5">
                        <FileDown className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── Referências do curso ── */}
        {courseReferences.length > 0 && (
          <div className="border-t border-border">
            <div className="px-6 pt-6 pb-2">
              <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">Referências</p>
            </div>
            <div className="flex flex-col gap-2 px-6 pb-6">
              {courseReferences.map((ref) => (
                <a
                  key={ref.id}
                  href={ref.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {ref.title}
                    </p>
                    {ref.fileSize && (
                      <p className="font-sans text-xs text-muted">
                        {ref.fileSize < 1024 * 1024
                          ? `${(ref.fileSize / 1024).toFixed(0)} KB`
                          : `${(ref.fileSize / (1024 * 1024)).toFixed(1)} MB`}
                      </p>
                    )}
                  </div>
                  <FileDown className="w-4 h-4 text-muted group-hover:text-primary transition-colors shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Sidebar — lista de aulas ── */}
      <aside className="lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-surface overflow-y-auto lg:max-h-[calc(100vh-4rem)]">
        <div className="p-4 border-b border-border">
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">
            {t("courseContent")}
          </p>
          <p className="font-sans text-xs text-muted mt-1">
            {t("lessonsCompleted", { done: completedCount, total: totalCount })}
          </p>
        </div>

        <div className="flex flex-col">
          {modules.map((mod) => {
            const locked = isModuleLocked(mod);
            return (
              <div key={mod.id} className="border-b border-border">
                <button
                  onClick={() => !locked && toggleModule(mod.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${locked ? "cursor-default opacity-70" : "hover:bg-background"}`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                    {locked && <Lock className="w-3.5 h-3.5 text-muted shrink-0" />}
                    <span className="font-sans text-xs font-semibold text-foreground leading-snug">
                      {mod.title}
                    </span>
                  </div>
                  {locked ? (
                    <span className="font-sans text-[10px] text-muted shrink-0 whitespace-nowrap">
                      {formatReleaseDate(mod.releaseDate!)}
                    </span>
                  ) : (
                    <ChevronDown
                      className={`w-4 h-4 text-muted shrink-0 transition-transform ${openModules[mod.id] ? "rotate-180" : ""}`}
                    />
                  )}
                </button>

                {/* Apostilas dos temas */}
                {!locked && mod.topics.some((t) => t.apostilaUrl) && (
                  <div className="border-t border-border">
                    {mod.topics.filter((t) => t.apostilaUrl).map((t) => (
                      <a
                        key={t.id}
                        href={t.apostilaUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-primary/5 hover:bg-primary/10 transition-colors"
                      >
                        <FileDown className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-sans text-xs font-semibold text-primary truncate">{t.title}</span>
                      </a>
                    ))}
                  </div>
                )}

                {!locked && openModules[mod.id] && (
                  <div className="pb-2">
                    {mod.topics.map((topic) => (
                      <div key={topic.id}>
                        <p className="px-4 pt-2.5 pb-1 font-sans text-[10px] font-bold uppercase tracking-widest text-muted/60">
                          {topic.title}
                        </p>
                        {topic.lessons.map((lesson) => {
                          const isActive = lesson.id === currentLesson?.id;
                          const isDone = progress[lesson.id];
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => setCurrentLesson(lesson)}
                              className={`w-full flex items-start gap-3 pl-6 pr-4 py-2.5 text-left transition-colors ${
                                isActive
                                  ? "bg-primary/10 border-l-2 border-primary"
                                  : "hover:bg-background border-l-2 border-transparent"
                              }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                {isDone ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : isActive ? (
                                  <PlayCircle className="w-4 h-4 text-primary" />
                                ) : (
                                  <Circle className="w-4 h-4 text-muted/40" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-sans text-xs leading-snug ${isActive ? "text-primary font-semibold" : "text-foreground"}`}>
                                  {lesson.title}
                                </p>
                                {lesson.instructors && lesson.instructors.length > 0 && (
                                  <p className="font-sans text-[10px] text-muted/70 mt-0.5 leading-snug">
                                    {lesson.instructors.map((li) => li.instructor.user.name).filter(Boolean).join(" · ")}
                                  </p>
                                )}
                                {lesson.duration && (
                                  <p className="font-sans text-[10px] text-muted mt-0.5">
                                    {formatDuration(lesson.duration)}
                                  </p>
                                )}
                              </div>
                              {lesson.isFree && !isDone && (
                                <span className="font-sans text-[9px] font-semibold uppercase tracking-wider text-accent bg-accent/10 px-1.5 py-0.5 rounded shrink-0">
                                  {t("free")}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
