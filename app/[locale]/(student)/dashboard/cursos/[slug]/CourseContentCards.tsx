"use client";

import { BookOpen, Headphones, FileText } from "lucide-react";

type Props = {
  quizTotal: number;
  quizPassed: number;
  audioTotal: number;
};

export function CourseContentCards({ quizTotal, quizPassed, audioTotal }: Props) {
  if (quizTotal === 0 && audioTotal === 0) return null;

  return (
    <div className="mx-4 lg:mx-6 mt-4 grid grid-cols-3 gap-3">
      {/* ── Provas ── */}
      {quizTotal > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30">
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-primary/6 pointer-events-none" />
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <p className="font-sans text-2xl font-bold text-foreground tabular-nums">
            {quizPassed}
            <span className="text-muted font-normal text-lg">/{quizTotal}</span>
          </p>
          <p className="font-sans text-xs text-muted mt-0.5">Provas aprovadas</p>
          {quizTotal > 0 && (
            <div className="mt-3 h-1 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${(quizPassed / quizTotal) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── AudioCast ── */}
      {audioTotal > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#00a3c4]/30">
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-[#00a3c4]/6 pointer-events-none" />
          <div className="w-9 h-9 rounded-xl bg-[#00a3c4]/10 flex items-center justify-center mb-3">
            <Headphones className="w-4 h-4 text-[#00a3c4]" />
          </div>
          <p className="font-sans text-2xl font-bold text-foreground tabular-nums">{audioTotal}</p>
          <p className="font-sans text-xs text-muted mt-0.5">
            {audioTotal === 1 ? "AudioCast" : "AudioCasts"}
          </p>
        </div>
      )}

      {/* ── Apostilas (placeholder) ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-surface/60 p-4">
        <div className="w-9 h-9 rounded-xl bg-border/30 flex items-center justify-center mb-3">
          <FileText className="w-4 h-4 text-muted/40" />
        </div>
        <p className="font-sans text-2xl font-bold text-muted/30">—</p>
        <p className="font-sans text-xs text-muted/40 mt-0.5">Apostilas · em breve</p>
      </div>
    </div>
  );
}
