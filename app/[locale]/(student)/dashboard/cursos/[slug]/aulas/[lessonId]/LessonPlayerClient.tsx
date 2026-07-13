"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import MuxPlayer from "@mux/mux-player-react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  PlayCircle,
  NotebookPen,
  Check,
  Lock,
  Award,
  Star,
  FileDown,
  ChevronDown,
  BookOpen,
  Shield,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { saveNote } from "../../noteActions";
import QuizPanel from "../../QuizPanel";
import CommentSection from "../../CommentSection";

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
};

type CourseRef = { id: string; title: string; fileUrl: string; fileSize: number | null };

type Props = {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  modules: Module[];
  currentLessonId: string;
  initialProgress: Record<string, boolean>;
  initialNotes: Record<string, string>;
  quizzes: Record<string, { id: string; title: string; questions: Array<{ id: string; text: string; order: number; options: Array<{ id: string; text: string; order: number }> }> }>;
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
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function fmtDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

function isLocked(mod: Module): boolean {
  if (!mod.releaseDate) return false;
  return new Date(mod.releaseDate) > new Date();
}

function fmtDate(d: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" }).format(new Date(d));
}

export default function LessonPlayerClient({
  courseId,
  courseSlug,
  courseTitle,
  modules,
  currentLessonId,
  initialProgress,
  initialNotes,
  quizzes,
  previousAttempts,
  initialCertificateId,
  currentUserId,
  currentUserRole,
  currentUserName,
  courseReferences = [],
}: Props) {
  const t = useTranslations("dashboard.courses");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState(initialProgress);
  const [certificateId, setCertificateId] = useState(initialCertificateId);
  const [showCelebration, setShowCelebration] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    modules.forEach((m) => {
      const hasCurrentLesson = m.topics.some((t) =>
        t.lessons.some((l) => l.id === currentLessonId)
      );
      init[m.id] = hasCurrentLesson || !isLocked(m);
    });
    return init;
  });

  // Notes
  const [noteContent, setNoteContent] = useState(initialNotes[currentLessonId] ?? "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allUnlockedLessons = modules
    .filter((m) => !isLocked(m))
    .flatMap((m) => m.topics.flatMap((t) => t.lessons));

  const currentLesson = allUnlockedLessons.find((l) => l.id === currentLessonId) ?? null;
  const currentIndex = currentLesson
    ? allUnlockedLessons.findIndex((l) => l.id === currentLessonId)
    : -1;
  const prevLesson = currentIndex > 0 ? allUnlockedLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allUnlockedLessons.length - 1
      ? allUnlockedLessons[currentIndex + 1]
      : null;

  const completedCount = Object.values(progress).filter(Boolean).length;
  const totalCount = allUnlockedLessons.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const hasMux = Boolean(currentLesson?.muxPlaybackId);
  const youtubeId =
    !hasMux && currentLesson?.videoUrl
      ? extractYoutubeId(currentLesson.videoUrl)
      : null;

  // Find module/topic for current lesson
  const currentModule = modules.find((m) =>
    m.topics.some((t) => t.lessons.some((l) => l.id === currentLessonId))
  );
  const currentTopic = currentModule?.topics.find((t) =>
    t.lessons.some((l) => l.id === currentLessonId)
  );

  // Next lesson info for sidebar card
  const nextLessonModule = nextLesson
    ? modules.find((m) => m.topics.some((t) => t.lessons.some((l) => l.id === nextLesson.id)))
    : null;

  function handleNoteChange(value: string) {
    setNoteContent(value);
    setSaveStatus("idle");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      await saveNote(currentLessonId, value);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 1500);
  }

  function handleMarkComplete(completed: boolean) {
    startTransition(async () => {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: currentLessonId, courseId, completed }),
      });
      if (res.ok) {
        const data = await res.json();
        setProgress((prev) => ({ ...prev, [currentLessonId]: completed }));
        if (data.courseCompleted && data.certificateId) {
          setCertificateId(data.certificateId);
          setShowCelebration(true);
          return;
        }
        if (completed && nextLesson) {
          router.push(`/dashboard/cursos/${courseSlug}/aulas/${nextLesson.id}`);
        }
      }
    });
  }

  // AudioCasts section
  const allAudiocasts = modules
    .filter((m) => !isLocked(m))
    .flatMap((m) => m.topics.flatMap((t) => t.lessons.filter((l) => l.audioUrl)));

  const apostilas = modules
    .filter((m) => !isLocked(m))
    .flatMap((m) =>
      m.topics
        .filter((t) => t.apostilaUrl)
        .map((t) => ({ title: t.title, url: t.apostilaUrl! }))
    );

  const audioPalettes = [
    { from: "#0d2d3d", to: "#00a3c4" },
    { from: "#1a0d2d", to: "#7c3aed" },
    { from: "#0d2018", to: "#059669" },
    { from: "#2d1a0d", to: "#d97706" },
    { from: "#1e0d1a", to: "#db2777" },
  ];

  const waveHeights = [4, 9, 18, 26, 14, 22, 9, 16, 22, 7, 20, 11, 24, 8, 17, 5, 13, 21, 9, 17];

  const refGradients = [
    "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)",
    "linear-gradient(135deg,#0d1b2a 0%,#1b263b 50%,#415a77 100%)",
    "linear-gradient(135deg,#1b0000 0%,#3d0000 50%,#6b0f1a 100%)",
    "linear-gradient(135deg,#0a2e1a 0%,#145a32 50%,#1e8449 100%)",
    "linear-gradient(135deg,#1a0533 0%,#3d1566 50%,#6c3483 100%)",
    "linear-gradient(135deg,#1a1000 0%,#4a3000 50%,#7d5a00 100%)",
  ];

  // ── Celebration modal ──
  if (showCelebration) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
        <div className="relative w-full max-w-lg bg-surface border border-border rounded-3xl p-8 text-center shadow-2xl">
          <div className="flex justify-center gap-1 mb-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
            <Award className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-serif text-2xl font-medium text-foreground mb-2">
            Parabéns! Curso concluído.
          </h2>
          <p className="font-sans text-sm text-muted mb-1">Você completou todas as aulas de</p>
          <p className="font-sans text-sm font-semibold text-foreground mb-6">{courseTitle}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {certificateId && (
              <a
                href={`/api/certificates/${certificateId}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 font-sans text-sm font-semibold px-6 py-3 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
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
              Disponível em{" "}
              <button
                onClick={() => router.push("/dashboard/certificados")}
                className="underline hover:no-underline"
              >
                Meus certificados
              </button>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8 min-h-[calc(100vh-0px)] bg-background flex flex-col">
      {/* ── Top bar ── */}
      <div className="bg-surface border-b border-border px-5 py-3 flex items-center justify-between shrink-0">
        <Link
          href={`/dashboard/cursos/${courseSlug}`}
          className="inline-flex items-center gap-1.5 font-sans text-sm text-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar ao curso
        </Link>

        <div className="flex items-center gap-4">
          {/* Progress pill */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="font-sans text-xs text-muted tabular-nums">{pct}%</span>
          </div>

          {/* Sidebar toggle (mobile) */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="lg:hidden flex items-center gap-1.5 font-sans text-xs font-semibold text-muted hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Aulas
          </button>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="flex flex-1 min-h-0">
        {/* ── Player column ── */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {/* Video area */}
          <div className="bg-black">
            <div className="w-full max-w-5xl mx-auto">
              <div className="aspect-video w-full">
                {hasMux ? (
                  <MuxPlayer
                    key={currentLesson!.muxPlaybackId!}
                    playbackId={currentLesson!.muxPlaybackId!}
                    streamType="on-demand"
                    style={{ height: "100%", width: "100%" }}
                    accentColor="#00475E"
                    onEnded={() => {
                      if (!progress[currentLessonId]) handleMarkComplete(true);
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
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/30">
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      <span className="absolute inset-0 rounded-full border-2 border-white/10 animate-ping" />
                      <div className="w-16 h-16 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
                        <PlayCircle className="w-8 h-8" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-sans text-sm font-semibold text-white/60 mb-1">
                        Player protegido da NU.V.E.M Ensino
                      </p>
                      <p className="font-sans text-xs text-white/30">
                        Acesso vinculado à matrícula
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AudioCast player bar */}
          {currentLesson?.audioUrl && (
            <div className="bg-canvas border-b border-canvas-border px-5 py-3 flex items-center gap-3 max-w-5xl mx-auto w-full">
              <span className="text-primary text-lg shrink-0">🎙</span>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
                  AudioCast
                </p>
                <audio
                  controls
                  src={currentLesson.audioUrl}
                  className="w-full h-8"
                  style={{ accentColor: "#00a3c4" }}
                />
              </div>
            </div>
          )}

          {/* Copyright notice */}
          {(hasMux || youtubeId) && (
            <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 flex items-start gap-2 max-w-5xl mx-auto w-full">
              <span className="text-amber-600 text-xs mt-0.5 shrink-0">⚠</span>
              <p className="font-sans text-[11px] text-amber-800 leading-relaxed">
                É proibida a reprodução total ou parcial das aulas por qualquer meio ou processo. A violação de direitos autorais constitui crime (art. 184 do CP e Lei nº 9.610/98).
              </p>
            </div>
          )}

          {/* Lesson info */}
          <div className="max-w-5xl mx-auto w-full px-5 lg:px-8 py-6">
            {/* Breadcrumb */}
            {currentModule && (
              <p className="font-sans text-xs text-muted mb-1">
                {courseTitle}
                {currentModule && (
                  <>
                    <span className="mx-1.5 text-border">›</span>
                    {currentModule.title}
                  </>
                )}
                {currentTopic && (
                  <>
                    <span className="mx-1.5 text-border">›</span>
                    {currentTopic.title}
                  </>
                )}
              </p>
            )}

            {/* Lesson title + actions */}
            <div className="flex items-start justify-between gap-4 flex-wrap mt-1">
              <h1 className="font-serif text-xl lg:text-2xl font-medium text-foreground">
                {currentLesson?.title ?? "Aula"}
              </h1>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Mark complete */}
                <button
                  onClick={() => handleMarkComplete(!progress[currentLessonId])}
                  disabled={isPending}
                  className={`flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2.5 rounded-full border transition-all ${
                    progress[currentLessonId]
                      ? "bg-green-500/10 border-green-500/30 text-green-600"
                      : "border-primary text-primary hover:bg-primary hover:text-white"
                  }`}
                >
                  {progress[currentLessonId] ? (
                    <>
                      <CheckCircle className="w-4 h-4" /> Concluída
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4" /> Marcar como concluída
                    </>
                  )}
                </button>

                {/* Apostila do tópico */}
                {currentTopic?.apostilaUrl && (
                  <a
                    href={currentTopic.apostilaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2.5 rounded-full border border-border text-muted hover:text-foreground hover:border-foreground/30 transition-all"
                  >
                    <FileDown className="w-4 h-4" />
                    Material da aula
                  </a>
                )}
              </div>
            </div>

            {/* Instructors */}
            {currentLesson?.instructors && currentLesson.instructors.length > 0 && (
              <p className="font-sans text-sm text-primary/70 font-medium mt-2">
                {currentLesson.instructors
                  .map((li) => li.instructor.user.name)
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}

            {/* Description */}
            {currentLesson?.description && (
              <div className="mt-5 p-5 bg-surface border border-border rounded-2xl">
                <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted mb-3">
                  Sobre esta aula
                </p>
                <p className="font-sans text-sm text-muted leading-relaxed whitespace-pre-line">
                  {currentLesson.description}
                </p>
              </div>
            )}

            {/* Prev / Next navigation */}
            <div className="flex items-center justify-between mt-6 pt-5 border-t border-border">
              {prevLesson ? (
                <Link
                  href={`/dashboard/cursos/${courseSlug}/aulas/${prevLesson.id}`}
                  className="flex items-center gap-2 font-sans text-sm text-muted hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:block">Anterior</span>
                </Link>
              ) : (
                <div />
              )}

              <div className="text-center">
                <p className="font-sans text-xs text-muted">
                  Aula {currentIndex + 1} de {allUnlockedLessons.length}
                </p>
              </div>

              {nextLesson ? (
                <Link
                  href={`/dashboard/cursos/${courseSlug}/aulas/${nextLesson.id}`}
                  className="flex items-center gap-2 font-sans text-sm text-muted hover:text-foreground transition-colors"
                >
                  <span className="hidden sm:block">Próxima</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <div />
              )}
            </div>

            {/* Quiz */}
            {currentLessonId && quizzes[currentLessonId] && (
              <div className="mt-6">
                <QuizPanel
                  key={currentLessonId}
                  quiz={quizzes[currentLessonId]}
                  previousAttempt={previousAttempts[quizzes[currentLessonId].id] ?? null}
                />
              </div>
            )}

            {/* Notes */}
            <div className="mt-6">
              <div className="border border-border rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
                  <div className="flex items-center gap-2">
                    <NotebookPen className="w-3.5 h-3.5 text-muted" />
                    <span className="font-sans text-xs font-semibold text-muted uppercase tracking-wider">
                      Anotações
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {saveStatus === "saving" && (
                      <span className="font-sans text-[10px] text-muted animate-pulse">
                        Salvando...
                      </span>
                    )}
                    {saveStatus === "saved" && (
                      <span className="flex items-center gap-1 font-sans text-[10px] text-green-600">
                        <Check className="w-3 h-3" /> Salvo
                      </span>
                    )}
                  </div>
                </div>
                <textarea
                  value={noteContent}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder="Suas anotações sobre esta aula..."
                  rows={5}
                  className="w-full px-4 py-3 font-sans text-sm text-foreground bg-surface placeholder:text-muted/40 resize-none focus:outline-none"
                />
              </div>
            </div>

            {/* Comments */}
            <div className="mt-6">
              <CommentSection
                lessonId={currentLessonId}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                currentUserName={currentUserName}
              />
            </div>

            {/* AudioCasts */}
            {allAudiocasts.length > 0 && (
              <div className="mt-8 border-t border-border pt-6">
                <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-4">
                  AudioCasts
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
                  {allAudiocasts.map((lesson, i) => {
                    const pal = audioPalettes[i % audioPalettes.length];
                    const isPlaying = lesson.id === currentLessonId;
                    return (
                      <Link
                        key={lesson.id}
                        href={`/dashboard/cursos/${courseSlug}/aulas/${lesson.id}`}
                        className="shrink-0 relative w-36 h-52 rounded-xl overflow-hidden group focus:outline-none"
                        style={{
                          transform: isPlaying ? "scale(1.04)" : undefined,
                          boxShadow: isPlaying ? `0 0 0 2px #00a3c4, 0 8px 24px rgba(0,163,196,0.35)` : undefined,
                          transition: "transform 0.2s ease, box-shadow 0.2s ease",
                        }}
                      >
                        <div
                          className="absolute inset-0 transition-transform duration-300 group-hover:scale-105"
                          style={{ background: `linear-gradient(135deg, ${pal.from} 0%, ${pal.to}80 100%)` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-35 transition-opacity">
                          <svg viewBox="0 0 82 42" className="w-28 h-14" fill="none">
                            {waveHeights.map((h, j) => (
                              <rect key={j} x={j * 4 + 1} y={(42 - h) / 2} width="2.5" height={h} rx="1.25" fill="white" />
                            ))}
                          </svg>
                        </div>
                        <div className="absolute top-2.5 left-2.5">
                          <span className="font-sans text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: pal.to, color: "white" }}>
                            AudioCast
                          </span>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 px-2.5 py-2.5" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 60%, transparent)" }}>
                          <p className="font-sans text-[11px] font-semibold text-white leading-tight line-clamp-3">{lesson.title}</p>
                          {lesson.duration && (
                            <p className="font-sans text-[10px] mt-1 text-white/50">{fmtDuration(lesson.duration)}</p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Apostilas */}
            {apostilas.length > 0 && (
              <div className="mt-8 border-t border-border pt-6">
                <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-4">
                  Apostilas
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2">
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
                        <p className="font-sans text-[11px] font-semibold text-white leading-tight line-clamp-3 w-full">{ap.title}</p>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity">
                        <svg viewBox="0 0 24 24" className="w-14 h-14" fill="none" stroke="white" strokeWidth="1">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                      </div>
                      <div className="absolute top-2.5 left-2.5">
                        <span className="font-sans text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/15 text-white/80">Apostila</span>
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
            )}

            {/* Referências */}
            {courseReferences.length > 0 && (
              <div className="mt-8 border-t border-border pt-6">
                <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-4">
                  Referências
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {courseReferences.map((ref, i) => {
                    const sizeTxt = ref.fileSize
                      ? ref.fileSize < 1024 * 1024
                        ? `${(ref.fileSize / 1024).toFixed(0)} KB`
                        : `${(ref.fileSize / (1024 * 1024)).toFixed(1)} MB`
                      : null;
                    return (
                      <a
                        key={ref.id}
                        href={ref.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 relative w-36 h-52 rounded-xl overflow-hidden group"
                        style={{ background: refGradients[i % refGradients.length] }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-15 group-hover:opacity-25 transition-opacity">
                          <svg viewBox="0 0 24 24" className="w-16 h-16" fill="none" stroke="white" strokeWidth="0.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                          </svg>
                        </div>
                        <div className="absolute top-2.5 left-2.5">
                          <span className="font-sans text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/15 text-white/80">Referência</span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="font-sans text-[11px] font-semibold text-white leading-tight line-clamp-3">{ref.title}</p>
                          {sizeTxt && <p className="font-sans text-[9px] text-white/50 mt-1">{sizeTxt}</p>}
                        </div>
                        <div className="absolute bottom-12 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5">
                            <FileDown className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right sidebar: info + lesson list ── */}
        <aside
          className={`
            shrink-0 border-l border-border bg-surface overflow-y-auto flex-col
            lg:flex lg:w-80
            ${sidebarOpen ? "fixed inset-y-0 right-0 z-40 flex w-80 shadow-2xl" : "hidden"}
          `}
        >
          {/* Mobile close */}
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">
              Conteúdo do curso
            </p>
            <button
              onClick={() => setSidebarOpen(false)}
              className="font-sans text-xs text-muted hover:text-foreground"
            >
              Fechar
            </button>
          </div>

          {/* Protection card */}
          <div className="p-4 border-b border-border">
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <p className="font-sans text-xs font-semibold text-primary">
                  Conteúdo protegido
                </p>
              </div>
              <p className="font-sans text-[11px] text-muted leading-relaxed">
                Acesso individual vinculado à sua matrícula.
              </p>
            </div>
          </div>

          {/* Next step card */}
          {nextLesson && (
            <div className="p-4 border-b border-border">
              <div className="bg-surface border border-border rounded-xl p-3">
                <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted mb-2">
                  Próxima etapa
                </p>
                <p className="font-sans text-xs text-foreground leading-snug mb-2 line-clamp-2">
                  {nextLesson.title}
                </p>
                {nextLessonModule && (
                  <p className="font-sans text-[10px] text-muted mb-3">
                    {nextLessonModule.title}
                  </p>
                )}
                <Link
                  href={`/dashboard/cursos/${courseSlug}/aulas/${nextLesson.id}`}
                  className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Ir para próxima <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Progress */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between font-sans text-[11px] text-muted mb-1.5">
              <span>Progresso</span>
              <span>{completedCount}/{totalCount} aulas</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Module/lesson list */}
          <div className="flex flex-col flex-1">
            {modules.map((mod) => {
              const locked = isLocked(mod);
              return (
                <div key={mod.id} className="border-b border-border">
                  <button
                    onClick={() =>
                      !locked &&
                      setOpenModules((p) => ({ ...p, [mod.id]: !p[mod.id] }))
                    }
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                      locked ? "cursor-default opacity-60" : "hover:bg-background"
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                      {locked && <Lock className="w-3.5 h-3.5 text-muted shrink-0" />}
                      <span className="font-sans text-xs font-semibold text-foreground leading-snug truncate">
                        {mod.title}
                      </span>
                    </div>
                    {locked ? (
                      <span className="font-sans text-[10px] text-muted shrink-0 whitespace-nowrap">
                        {fmtDate(mod.releaseDate!)}
                      </span>
                    ) : (
                      <ChevronDown
                        className={`w-4 h-4 text-muted shrink-0 transition-transform ${
                          openModules[mod.id] ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </button>

                  {!locked && openModules[mod.id] && (
                    <div className="pb-1">
                      {mod.topics.map((topic) => (
                        <div key={topic.id}>
                          <p className="px-4 pt-2 pb-1 font-sans text-[10px] font-bold uppercase tracking-widest text-muted/60">
                            {topic.title}
                          </p>
                          {topic.lessons.map((lesson) => {
                            const isActive = lesson.id === currentLessonId;
                            const isDone = progress[lesson.id];
                            return (
                              <Link
                                key={lesson.id}
                                href={`/dashboard/cursos/${courseSlug}/aulas/${lesson.id}`}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-start gap-3 pl-5 pr-4 py-2.5 border-l-2 transition-colors ${
                                  isActive
                                    ? "bg-primary/8 border-l-primary"
                                    : "hover:bg-background border-l-transparent"
                                }`}
                              >
                                <div className="mt-0.5 shrink-0">
                                  {isDone ? (
                                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                  ) : isActive ? (
                                    <PlayCircle className="w-3.5 h-3.5 text-primary" />
                                  ) : (
                                    <Circle className="w-3.5 h-3.5 text-border" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`font-sans text-xs leading-snug ${
                                      isActive
                                        ? "text-primary font-semibold"
                                        : "text-foreground"
                                    }`}
                                  >
                                    {lesson.title}
                                  </p>
                                  {lesson.duration && (
                                    <p className="font-sans text-[10px] text-muted mt-0.5">
                                      {fmtDuration(lesson.duration)}
                                    </p>
                                  )}
                                </div>
                              </Link>
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

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
