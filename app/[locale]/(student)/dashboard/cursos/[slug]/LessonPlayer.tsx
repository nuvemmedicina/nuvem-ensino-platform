"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import MuxPlayer from "@mux/mux-player-react";
import { CheckCircle, Circle, PlayCircle, ChevronDown, ChevronRight, NotebookPen, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { saveNote } from "./noteActions";
import QuizPanel from "./QuizPanel";

type Lesson = {
  id: string;
  title: string;
  duration: number | null;
  videoUrl: string | null;
  muxPlaybackId: string | null;
  isFree: boolean;
  order: number;
};

type Module = {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
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

type Props = {
  courseId: string;
  modules: Module[];
  initialProgress: ProgressMap;
  initialLessonId: string | null;
  initialNotes: Record<string, string>;
  quizzes: Record<string, QuizData>;
  previousAttempts: Record<string, { score: number; total: number }>;
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

export default function LessonPlayer({ courseId, modules, initialProgress, initialLessonId, initialNotes, quizzes, previousAttempts }: Props) {
  const t = useTranslations("dashboard.courses");

  const allLessons = modules.flatMap((m) => m.lessons);
  const firstLesson = allLessons[0] ?? null;
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(
    initialLessonId ? (allLessons.find((l) => l.id === initialLessonId) ?? firstLesson) : firstLesson
  );
  const [progress, setProgress] = useState<ProgressMap>(initialProgress);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    modules.forEach((m, i) => { initial[m.id] = i === 0; });
    return initial;
  });
  const [isPending, startTransition] = useTransition();

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
        setProgress((prev) => ({ ...prev, [lesson.id]: completed }));
        if (completed) {
          const idx = allLessons.findIndex((l) => l.id === lesson.id);
          if (idx !== -1 && idx < allLessons.length - 1) {
            setCurrentLesson(allLessons[idx + 1]);
            const nextLesson = allLessons[idx + 1];
            const nextModule = modules.find((m) => m.lessons.some((l) => l.id === nextLesson.id));
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
              <p className="font-sans text-xs text-muted mb-1">
                {modules.find((m) => m.lessons.some((l) => l.id === currentLesson?.id))?.title}
              </p>
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
          {modules.map((mod) => (
            <div key={mod.id} className="border-b border-border">
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-background transition-colors"
              >
                <span className="font-sans text-xs font-semibold text-foreground pr-2 leading-snug">
                  {mod.title}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-muted shrink-0 transition-transform ${openModules[mod.id] ? "rotate-180" : ""}`}
                />
              </button>

              {openModules[mod.id] && (
                <div className="pb-2">
                  {mod.lessons.map((lesson) => {
                    const isActive = lesson.id === currentLesson?.id;
                    const isDone = progress[lesson.id];

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setCurrentLesson(lesson)}
                        className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${
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
              )}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
