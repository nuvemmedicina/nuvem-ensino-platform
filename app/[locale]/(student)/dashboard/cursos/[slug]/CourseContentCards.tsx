"use client";

import { BookOpen } from "lucide-react";

type Props = {
  quizTotal: number;
  quizPassed: number;
  audioTotal?: number;
};

export function CourseContentCards({ quizTotal, quizPassed }: Props) {
  if (quizTotal === 0) return null;

  return (
    <div className="mx-4 lg:mx-6 mt-4">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30 max-w-xs">
        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-primary/6 pointer-events-none" />
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
          <BookOpen className="w-4 h-4 text-primary" />
        </div>
        <p className="font-sans text-2xl font-bold text-foreground tabular-nums">
          {quizPassed}
          <span className="text-muted font-normal text-lg">/{quizTotal}</span>
        </p>
        <p className="font-sans text-xs text-muted mt-0.5">Provas aprovadas</p>
        <div className="mt-3 h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${(quizPassed / quizTotal) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
