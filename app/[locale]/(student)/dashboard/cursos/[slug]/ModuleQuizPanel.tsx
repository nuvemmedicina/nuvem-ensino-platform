"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle, XCircle, Clock, Lock, Trophy, RotateCcw, ChevronRight, BookOpen,
} from "lucide-react";
import { submitModuleQuiz } from "./submitModuleQuiz";

type Option = { id: string; text: string; order: number };
type Question = { id: string; text: string; order: number; options: Option[] };
type Quiz = {
  id: string;
  title: string;
  availableFrom: Date | string | null;
  availableUntil: Date | string | null;
  passingPct: number;
  maxAttempts: number;
  questions: Question[];
};
type Attempt = { score: number; total: number; passed: boolean; createdAt: Date | string };
type Result = { score: number; total: number; passed: boolean; attemptsLeft: number; correct: Record<string, string> };

type Props = { moduleTitle: string; quiz: Quiz; previousAttempts: Attempt[] };

function fmt(d: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(d));
}

const LETTERS = ["A", "B", "C", "D", "E"];

export function ModuleQuizPanel({ moduleTitle, quiz, previousAttempts }: Props) {
  const now = new Date();
  const availableFrom = quiz.availableFrom ? new Date(quiz.availableFrom) : null;
  const availableUntil = quiz.availableUntil ? new Date(quiz.availableUntil) : null;
  const notYet = !!(availableFrom && now < availableFrom);
  const expired = !!(availableUntil && now > availableUntil);
  const attemptsUsed = previousAttempts.length;
  const attemptsLeft = quiz.maxAttempts - attemptsUsed;
  const bestAttempt = previousAttempts.reduce<Attempt | null>(
    (best, a) => (!best || a.score > best.score ? a : best), null,
  );
  const alreadyPassed = previousAttempts.some((a) => a.passed);
  const exhausted = attemptsLeft <= 0;
  const canTake = !notYet && !expired && !alreadyPassed && !exhausted;

  type Phase = "summary" | "quiz" | "result";
  const [phase, setPhase] = useState<Phase>("summary");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const currentQuestion = quiz.questions[currentIndex];
  const isLastQuestion = currentIndex === quiz.questions.length - 1;
  const currentAnswered = !!(currentQuestion && answers[currentQuestion.id]);
  const progressPct = quiz.questions.length > 0
    ? Math.round((currentIndex / quiz.questions.length) * 100)
    : 0;

  function handleSelect(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function handleNext() {
    if (isLastQuestion) {
      setError("");
      startTransition(async () => {
        try {
          const res = await submitModuleQuiz(quiz.id, answers);
          setResult(res);
          setPhase("result");
        } catch (e) {
          setError((e as Error).message);
        }
      });
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  function handleRetry() {
    setAnswers({});
    setResult(null);
    setError("");
    setCurrentIndex(0);
    setPhase("quiz");
  }

  // ── SUMMARY ──────────────────────────────────────────────────────────────
  if (phase === "summary") {
    return (
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            alreadyPassed ? "bg-green-500/15" : notYet || expired || exhausted ? "bg-border/40" : "bg-primary/10"
          }`}>
            <BookOpen className={`w-5 h-5 ${
              alreadyPassed ? "text-green-600" : notYet || expired || exhausted ? "text-muted" : "text-primary"
            }`} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">
              Prova — {moduleTitle}
            </p>
            <p className="font-sans text-sm font-semibold text-foreground">{quiz.title}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {alreadyPassed && (
                <span className="inline-flex items-center gap-1 font-sans text-[11px] font-semibold text-green-700 bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" /> Aprovado
                </span>
              )}
              {notYet && (
                <span className="inline-flex items-center gap-1 font-sans text-[11px] font-semibold text-muted bg-border/40 px-2.5 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" /> Disponível em {fmt(availableFrom!)}
                </span>
              )}
              {expired && !alreadyPassed && (
                <span className="inline-flex items-center gap-1 font-sans text-[11px] font-semibold text-red-600 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" /> Prazo encerrado
                </span>
              )}
              {exhausted && !alreadyPassed && !expired && (
                <span className="inline-flex items-center gap-1 font-sans text-[11px] font-semibold text-red-600 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full">
                  <XCircle className="w-3 h-3" /> Tentativas esgotadas
                </span>
              )}
              {!alreadyPassed && !notYet && !expired && !exhausted && (
                <span className="inline-flex items-center gap-1 font-sans text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                  Pendente
                </span>
              )}
              {attemptsUsed > 0 && bestAttempt && (
                <span className="font-sans text-[11px] text-muted">
                  Melhor: {bestAttempt.score}/{bestAttempt.total} ({Math.round((bestAttempt.score / bestAttempt.total) * 100)}%)
                  · {attemptsUsed}/{quiz.maxAttempts} tentativas usadas
                </span>
              )}
            </div>
          </div>

          {canTake && (
            <button
              onClick={() => setPhase("quiz")}
              className="shrink-0 flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              {attemptsUsed > 0 ? "Tentar novamente" : "Fazer prova"}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── QUIZ (Flashcard) ──────────────────────────────────────────────────────
  if (phase === "quiz") {
    return (
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-border">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="px-5 py-5">
          {/* Counter */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs font-bold text-muted uppercase tracking-wider">
                {currentIndex + 1} / {quiz.questions.length}
              </span>
              <div className="flex gap-1">
                {quiz.questions.map((_, i) => (
                  <span
                    key={i}
                    className={`block w-1.5 h-1.5 rounded-full transition-colors ${
                      i < currentIndex ? "bg-primary" : i === currentIndex ? "bg-primary/60" : "bg-border"
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="font-sans text-[11px] text-muted">
              {attemptsLeft} tentativa{attemptsLeft !== 1 ? "s" : ""} restante{attemptsLeft !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Question */}
          <p className="font-serif text-base font-medium text-foreground leading-relaxed mb-5">
            {currentQuestion.text}
          </p>

          {/* Options */}
          <div className="space-y-2.5 mb-5">
            {currentQuestion.options.map((opt, oi) => {
              const selected = answers[currentQuestion.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(currentQuestion.id, opt.id)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border font-sans text-sm transition-all duration-200 ${
                    selected
                      ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                      : "border-border hover:border-primary/40 hover:bg-primary/5 text-foreground"
                  }`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
                    selected ? "bg-primary text-white" : "bg-border/60 text-muted"
                  }`}>
                    {LETTERS[oi]}
                  </span>
                  <span className="leading-snug">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {error && <p className="mb-3 font-sans text-xs text-red-500">{error}</p>}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setPhase("summary"); setAnswers({}); setCurrentIndex(0); }}
              className="font-sans text-xs text-muted hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!currentAnswered || isPending}
              className="flex items-center gap-2 font-sans text-sm font-semibold px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-40 transition-all"
            >
              {isPending ? "Enviando…" : isLastQuestion ? "Enviar respostas" : "Próxima"}
              {!isPending && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (phase === "result" && result) {
    const pct = Math.round((result.score / result.total) * 100);
    return (
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-5 py-8 flex flex-col items-center text-center gap-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            result.passed ? "bg-green-500/15" : "bg-red-500/10"
          }`}>
            {result.passed
              ? <Trophy className="w-10 h-10 text-green-600" />
              : <XCircle className="w-10 h-10 text-red-500" />}
          </div>

          <div>
            <p className={`font-sans text-sm font-bold uppercase tracking-widest mb-1 ${
              result.passed ? "text-green-600" : "text-red-500"
            }`}>
              {result.passed ? "Aprovado!" : "Não atingiu a nota mínima"}
            </p>
            <p className="font-sans text-5xl font-bold text-foreground">{pct}%</p>
            <p className="font-sans text-sm text-muted mt-1">
              {result.score} de {result.total} questões corretas
              <span className="mx-1.5 text-border">·</span>
              mínimo: {quiz.passingPct}%
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center mt-2">
            {result.passed ? (
              <button
                onClick={() => setPhase("summary")}
                className="flex items-center gap-2 font-sans text-sm font-semibold px-6 py-2.5 rounded-xl bg-green-500/10 text-green-700 hover:bg-green-500/20 border border-green-500/20 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Concluído
              </button>
            ) : result.attemptsLeft > 0 ? (
              <>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 font-sans text-sm font-semibold px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Tentar novamente
                  <span className="font-sans text-[11px] opacity-70">
                    ({result.attemptsLeft} restante{result.attemptsLeft !== 1 ? "s" : ""})
                  </span>
                </button>
                <button
                  onClick={() => setPhase("summary")}
                  className="font-sans text-xs text-muted hover:text-foreground transition-colors"
                >
                  Agora não
                </button>
              </>
            ) : (
              <button
                onClick={() => setPhase("summary")}
                className="font-sans text-sm font-semibold px-6 py-2.5 rounded-xl border border-border text-muted hover:text-foreground transition-colors"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
