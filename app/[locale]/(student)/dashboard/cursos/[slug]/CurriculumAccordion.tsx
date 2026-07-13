"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  CheckCircle,
  Circle,
  PlayCircle,
  Lock,
  FileText,
  Mic,
  BookOpen,
} from "lucide-react";

type Lesson = {
  id: string;
  title: string;
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

type Props = {
  courseSlug: string;
  modules: Module[];
  progressMap: Record<string, boolean>;
  currentLessonId?: string | null;
};

function isLocked(mod: Module): boolean {
  if (!mod.releaseDate) return false;
  return new Date(mod.releaseDate) > new Date();
}

function fmtDate(d: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" }).format(new Date(d));
}

function fmtDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

function lessonIcon(lesson: Lesson) {
  if (lesson.audioUrl && !lesson.muxPlaybackId && !lesson.videoUrl)
    return <Mic className="w-4 h-4 text-muted shrink-0" />;
  if (!lesson.muxPlaybackId && !lesson.videoUrl && !lesson.audioUrl)
    return <FileText className="w-4 h-4 text-muted shrink-0" />;
  return <PlayCircle className="w-4 h-4 text-muted shrink-0" />;
}

export default function CurriculumAccordion({ courseSlug, modules, progressMap, currentLessonId }: Props) {
  const [openModules, setOpenModules] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    modules.forEach((m, i) => { init[m.id] = i === 0; });
    return init;
  });

  const totalLessons = modules.flatMap((m) => m.topics.flatMap((t) => t.lessons)).length;
  const doneLessons = Object.values(progressMap).filter(Boolean).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-1 px-1">
        <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted">
          Conteúdo programático
        </p>
        <p className="font-sans text-[10px] text-muted">
          {doneLessons}/{totalLessons} aulas concluídas
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {modules.map((mod, modIdx) => {
          const locked = isLocked(mod);
          const modLessons = mod.topics.flatMap((t) => t.lessons);
          const modDone = modLessons.filter((l) => progressMap[l.id]).length;
          const isOpen = !!openModules[mod.id];

          return (
            <div key={mod.id} className={modIdx > 0 ? "border-t border-border" : ""}>
              {/* Module header */}
              <button
                onClick={() => !locked && setOpenModules((p) => ({ ...p, [mod.id]: !p[mod.id] }))}
                className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${
                  locked ? "cursor-default" : "hover:bg-background"
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {locked ? (
                    <Lock className="w-4 h-4 text-muted shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-border flex items-center justify-center shrink-0">
                      <span className="font-sans text-[10px] font-bold text-muted">{modIdx + 1}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-sans text-sm font-semibold text-foreground leading-snug truncate">
                      {mod.title}
                    </p>
                    {locked ? (
                      <p className="font-sans text-[11px] text-muted mt-0.5">
                        Disponível em {fmtDate(mod.releaseDate!)}
                      </p>
                    ) : (
                      <p className="font-sans text-[11px] text-muted mt-0.5">
                        {modLessons.length} {modLessons.length === 1 ? "aula" : "aulas"}
                        {modDone > 0 && ` · ${modDone} concluída${modDone > 1 ? "s" : ""}`}
                      </p>
                    )}
                  </div>
                </div>
                {!locked && (
                  <ChevronDown
                    className={`w-4 h-4 text-muted shrink-0 ml-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                )}
                {locked && (
                  <span className="font-sans text-[10px] text-muted/60 shrink-0 ml-3 whitespace-nowrap">
                    Liberação em {fmtDate(mod.releaseDate!)}
                  </span>
                )}
              </button>

              {/* Module lessons */}
              {!locked && isOpen && (
                <div className="border-t border-border/60">
                  {mod.topics.map((topic, topicIdx) => (
                    <div key={topic.id}>
                      {/* Topic label */}
                      <div className={`flex items-center gap-2 px-5 py-2.5 bg-background/60 ${topicIdx > 0 ? "border-t border-border/40" : ""}`}>
                        <BookOpen className="w-3 h-3 text-primary/50 shrink-0" />
                        <p className="font-sans text-[11px] font-semibold text-primary/70 uppercase tracking-wide">
                          {topic.title}
                        </p>
                        {topic.apostilaUrl && (
                          <a
                            href={topic.apostilaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="ml-auto font-sans text-[10px] font-semibold text-primary/60 hover:text-primary flex items-center gap-1 transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            Apostila
                          </a>
                        )}
                      </div>

                      {/* Lessons */}
                      {topic.lessons.map((lesson) => {
                        const isDone = progressMap[lesson.id];
                        const isActive = lesson.id === currentLessonId;

                        return (
                          <Link
                            key={lesson.id}
                            href={`/dashboard/cursos/${courseSlug}/aulas/${lesson.id}`}
                            className={`flex items-start gap-3 px-5 py-3.5 border-t border-border/30 transition-colors group ${
                              isActive
                                ? "bg-primary/6 border-l-2 border-l-primary"
                                : "hover:bg-background border-l-2 border-l-transparent"
                            }`}
                          >
                            {/* Status icon */}
                            <div className="mt-0.5 shrink-0">
                              {isDone ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : isActive ? (
                                <PlayCircle className="w-4 h-4 text-primary" />
                              ) : (
                                <Circle className="w-4 h-4 text-border group-hover:text-muted transition-colors" />
                              )}
                            </div>

                            {/* Lesson info */}
                            <div className="flex-1 min-w-0">
                              <p className={`font-sans text-sm leading-snug ${
                                isActive ? "text-primary font-semibold" : isDone ? "text-muted" : "text-foreground"
                              }`}>
                                {lesson.title}
                              </p>
                              {lesson.instructors && lesson.instructors.length > 0 && (
                                <p className="font-sans text-[11px] text-muted mt-0.5">
                                  {lesson.instructors.map((li) => li.instructor.user.name).filter(Boolean).join(" · ")}
                                </p>
                              )}
                            </div>

                            {/* Right side: type icon + duration */}
                            <div className="flex items-center gap-2 shrink-0 mt-0.5">
                              {lessonIcon(lesson)}
                              {lesson.duration && (
                                <span className="font-sans text-[11px] text-muted tabular-nums">
                                  {fmtDuration(lesson.duration)}
                                </span>
                              )}
                              {lesson.isFree && !isDone && (
                                <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                  Grátis
                                </span>
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
    </div>
  );
}
