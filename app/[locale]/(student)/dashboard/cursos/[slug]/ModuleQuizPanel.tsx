"use client";

import { useState, useTransition } from "react";
import { CheckCircle, XCircle, Clock, Lock, AlertTriangle, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
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

type Props = {
  moduleTitle: string;
  quiz: Quiz;
  previousAttempts: Attempt[];
};

function fmt(d: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}

export function ModuleQuizPanel({ moduleTitle, quiz, previousAttempts }: Props) {
  const now = new Date();
  const availableFrom = quiz.availableFrom ? new Date(quiz.availableFrom) : null;
  const availableUntil = quiz.availableUntil ? new Date(quiz.availableUntil) : null;

  const notYet = availableFrom && now < availableFrom;
  const expired = availableUntil && now > availableUntil;
  const attemptsUsed = previousAttempts.length;
  const attemptsLeft = quiz.maxAttempts - attemptsUsed;
  const bestAttempt = previousAttempts.reduce<Attempt | null>((best, a) => (!best || a.score > best.score ? a : best), null);
  const alreadyPassed = previousAttempts.some((a) => a.passed);
  const exhausted = attemptsLeft <= 0;

  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean; attemptsLeft: number; correct: Record<string, string> } | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSelect(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function handleSubmit() {
    setError("");
    startTransition(async () => {
      try {
        const res = await submitModuleQuiz(quiz.id, answers);
        setResult(res);
        setOpen(false);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  function handleRetry() {
    setAnswers({});
    setResult(null);
    setError("");
    setOpen(true);
  }

  const allAnswered = quiz.questions.length > 0 && quiz.questions.every((q) => answers[q.id]);

  // ── Status badge ────────────────────────────────────────────────────────
  const statusBadge = alreadyPassed ? (
    <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-green-700 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
      <CheckCircle className="w-3.5 h-3.5" /> Aprovado
    </span>
  ) : notYet ? (
    <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-muted bg-border/50 px-3 py-1 rounded-full">
      <Clock className="w-3.5 h-3.5" /> Disponível em {fmt(availableFrom!)}
    </span>
  ) : expired ? (
    <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-red-600 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
      <Lock className="w-3.5 h-3.5" /> Prazo encerrado
    </span>
  ) : exhausted ? (
    <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-red-600 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
      <XCircle className="w-3.5 h-3.5" /> Reprovado (tentativas esgotadas)
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
      <AlertTriangle className="w-3.5 h-3.5" /> Pendente
    </span>
  );

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">
            Prova — {moduleTitle}
          </p>
          <p className="font-sans text-sm font-semibold text-foreground">{quiz.title}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {statusBadge}
            {attemptsUsed > 0 && (
              <span className="font-sans text-xs text-muted">
                {attemptsUsed}/{quiz.maxAttempts} tentativas usadas
                {bestAttempt && ` · Melhor: ${bestAttempt.score}/${bestAttempt.total} (${Math.round((bestAttempt.score / bestAttempt.total) * 100)}%)`}
              </span>
            )}
          </div>
        </div>

        {!notYet && !expired && !alreadyPassed && !exhausted && !result && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="shrink-0 flex items-center gap-1.5 font-sans text-sm font-semibold px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {open ? "Fechar" : attemptsUsed > 0 ? "Tentar novamente" : "Fazer prova"}
          </button>
        )}
      </div>

      {/* Resultado imediato */}
      {result && (
        <div className={`mx-5 mb-4 rounded-xl p-4 border ${result.passed ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}`}>
          <div className="flex items-center gap-2 mb-2">
            {result.passed
              ? <CheckCircle className="w-5 h-5 text-green-600" />
              : <XCircle className="w-5 h-5 text-red-600" />}
            <p className={`font-sans text-sm font-bold ${result.passed ? "text-green-700" : "text-red-700"}`}>
              {result.passed ? "Aprovado!" : "Não atingiu a nota mínima"}
            </p>
          </div>
          <p className="font-sans text-sm text-foreground">
            Você acertou <strong>{result.score} de {result.total}</strong> questões ({Math.round((result.score / result.total) * 100)}%)
            — mínimo exigido: {quiz.passingPct}%
          </p>
          {!result.passed && result.attemptsLeft > 0 && (
            <button
              onClick={handleRetry}
              className="mt-3 flex items-center gap-2 font-sans text-xs font-semibold px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Tentar novamente ({result.attemptsLeft} {result.attemptsLeft === 1 ? "tentativa restante" : "tentativas restantes"})
            </button>
          )}
        </div>
      )}

      {/* Questões */}
      {open && !result && (
        <div className="border-t border-border">
          <div className="px-5 py-4 space-y-6">
            {quiz.questions.map((q, qi) => (
              <div key={q.id}>
                <p className="font-sans text-sm font-semibold text-foreground mb-3">
                  {qi + 1}. {q.text}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const selected = answers[q.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelect(q.id, opt.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl border font-sans text-sm transition-all ${
                          selected
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-border hover:border-primary/30 text-foreground"
                        }`}
                      >
                        {opt.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {error && <p className="px-5 pb-3 font-sans text-xs text-red-500">{error}</p>}

          <div className="px-5 pb-5 flex items-center justify-between gap-3">
            <p className="font-sans text-xs text-muted">
              {Object.keys(answers).length}/{quiz.questions.length} respondidas
              · {attemptsLeft} {attemptsLeft === 1 ? "tentativa restante" : "tentativas restantes"}
            </p>
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || isPending}
              className="flex items-center gap-2 font-sans text-sm font-semibold px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {isPending ? "Enviando…" : "Enviar respostas"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
