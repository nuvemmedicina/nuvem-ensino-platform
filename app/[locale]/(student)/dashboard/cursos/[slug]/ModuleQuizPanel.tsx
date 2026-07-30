"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle, XCircle, Clock, Lock, Trophy, RotateCcw, ChevronRight, BookOpen, Shuffle, Lightbulb,
} from "lucide-react";
import { submitModuleQuiz, type ReviewItem } from "./submitModuleQuiz";
import { startModuleQuiz } from "./startModuleQuiz";
import { moduleColor } from "@/lib/moduleColors";

type Question = { id: string; text: string; options: { id: string; text: string }[] };
type Quiz = {
  id: string;
  title: string;
  availableFrom: Date | string | null;
  availableUntil: Date | string | null;
  passingPct: number;
  maxAttempts: number;
  /** Total de questões cadastradas na prova (o banco do módulo). */
  totalQuestions: number;
  /** Quantas o aluno recebe por tentativa; null = todas. */
  questionsPerAttempt: number | null;
};
type Attempt = { score: number; total: number; passed: boolean; createdAt: Date | string };
type Result = {
  score: number; total: number; passed: boolean; attemptsLeft: number; review: ReviewItem[];
};

type Props = { moduleTitle: string; moduleIndex: number; quiz: Quiz; previousAttempts: Attempt[] };

function fmt(d: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(d));
}

const LETTERS = ["A", "B", "C", "D", "E"];

export function ModuleQuizPanel({ moduleTitle, moduleIndex, quiz, previousAttempts }: Props) {
  const cor = moduleColor(moduleIndex);
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
  const hasQuestions = quiz.totalQuestions > 0;
  const canTake = !notYet && !expired && !alreadyPassed && !exhausted && hasQuestions;

  const perAttempt =
    quiz.questionsPerAttempt && quiz.questionsPerAttempt < quiz.totalQuestions
      ? quiz.questionsPerAttempt
      : quiz.totalQuestions;
  const isDrawn = perAttempt < quiz.totalQuestions;

  type Phase = "summary" | "quiz" | "result";
  const [phase, setPhase] = useState<Phase>("summary");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const currentAnswered = !!(currentQuestion && answers[currentQuestion.id]);
  const progressPct = questions.length > 0
    ? Math.round((currentIndex / questions.length) * 100)
    : 0;

  function handleStart() {
    setError("");
    startTransition(async () => {
      const res = await startModuleQuiz(quiz.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setQuestions(res.quiz.questions);
      setAnswers({});
      setCurrentIndex(0);
      setResult(null);
      setPhase("quiz");
    });
  }

  function handleSelect(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function handleNext() {
    if (isLastQuestion) {
      setError("");
      startTransition(async () => {
        const res = await submitModuleQuiz(quiz.id, answers);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setResult(res);
        setPhase("result");
      });
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  // ── RESUMO ───────────────────────────────────────────────────────────────
  if (phase === "summary") {
    return (
      <div className="rounded-2xl border bg-surface overflow-hidden border-l-4" style={{ borderColor: cor.border, borderLeftColor: cor.accent }}>
        <div className="flex items-center gap-4 px-5 py-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              alreadyPassed ? "bg-green-500/15" : notYet || expired || exhausted ? "bg-border/40" : ""
            }`}
            style={!alreadyPassed && !notYet && !expired && !exhausted ? { backgroundColor: cor.tint } : undefined}
          >
            <BookOpen
              className={`w-5 h-5 ${
                alreadyPassed ? "text-green-600" : notYet || expired || exhausted ? "text-muted" : ""
              }`}
              style={!alreadyPassed && !notYet && !expired && !exhausted ? { color: cor.accent } : undefined}
            />
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
              {!alreadyPassed && !notYet && !expired && !exhausted && hasQuestions && (
                <span className="inline-flex items-center gap-1 font-sans text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                  Pendente
                </span>
              )}

              {hasQuestions && (
                <span className="font-sans text-[11px] text-muted">
                  {perAttempt} questõe{perAttempt !== 1 ? "s" : ""}
                  {isDrawn && ` sorteadas de ${quiz.totalQuestions}`}
                  <span className="mx-1.5 text-border">·</span>
                  mínimo {quiz.passingPct}%
                </span>
              )}

              {attemptsUsed > 0 && bestAttempt && (
                <span className="font-sans text-[11px] text-muted">
                  Melhor: {bestAttempt.score}/{bestAttempt.total} ({Math.round((bestAttempt.score / bestAttempt.total) * 100)}%)
                  · {attemptsUsed}/{quiz.maxAttempts} tentativas usadas
                </span>
              )}
            </div>

            {isDrawn && canTake && (
              <p className="flex items-center gap-1.5 font-sans text-[11px] text-muted mt-2">
                <Shuffle className="w-3 h-3 shrink-0" />
                Cada aluno recebe uma seleção diferente. Se precisar tentar de novo, as questões serão outras.
              </p>
            )}
            {error && <p className="font-sans text-xs text-red-500 mt-2">{error}</p>}
          </div>

          {canTake && (
            <button
              onClick={handleStart}
              disabled={isPending}
              className="shrink-0 flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {isPending ? "Preparando…" : attemptsUsed > 0 ? "Tentar novamente" : "Fazer prova"}
              {!isPending && <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── PROVA ────────────────────────────────────────────────────────────────
  if (phase === "quiz" && currentQuestion) {
    return (
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="h-1 bg-border">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="px-5 py-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs font-bold text-muted uppercase tracking-wider">
                {currentIndex + 1} / {questions.length}
              </span>
              <div className="flex gap-1">
                {questions.map((_, i) => (
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

          {/* O enunciado precisa dominar a tela: são casos clínicos longos, e a
              serifada tem altura de x baixa — no tamanho antigo lia-se pior que
              as alternativas, invertendo a hierarquia. */}
          <p className="font-serif text-xl sm:text-2xl font-medium text-foreground leading-snug mb-6">
            {currentQuestion.text}
          </p>

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

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setPhase("summary"); setAnswers({}); setCurrentIndex(0); setQuestions([]); }}
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

  // ── RESULTADO ────────────────────────────────────────────────────────────
  if (phase === "result" && result) {
    const pct = Math.round((result.score / result.total) * 100);
    const wrong = result.review.filter((r) => !r.isRight);

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
                  onClick={handleStart}
                  disabled={isPending}
                  className="flex items-center gap-2 font-sans text-sm font-semibold px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  {isPending ? "Preparando…" : "Tentar novamente"}
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

          {error && <p className="font-sans text-xs text-red-500">{error}</p>}
        </div>

        {/* Revisão: só as erradas, com a justificativa do gabarito */}
        {wrong.length > 0 && (
          <div className="border-t border-border bg-background/60 px-5 py-5">
            <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
              Revisão · {wrong.length} questõe{wrong.length !== 1 ? "s" : ""} para rever
            </p>
            <p className="font-sans text-xs text-muted mb-4">
              Abaixo apenas o que você errou, com a explicação do gabarito.
            </p>

            <div className="space-y-3">
              {wrong.map((item) => (
                <details key={item.questionId} className="group rounded-xl border border-border bg-surface overflow-hidden">
                  <summary className="flex items-start gap-3 px-4 py-3 cursor-pointer list-none hover:bg-primary/5 transition-colors">
                    <span className="w-5 h-5 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                      <XCircle className="w-3.5 h-3.5" />
                    </span>
                    <span className="flex-1 font-sans text-sm text-foreground leading-snug">
                      {item.text}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted shrink-0 mt-0.5 transition-transform group-open:rotate-90" />
                  </summary>

                  <div className="px-4 pb-4 pt-3 space-y-2.5 border-t border-border/60">
                    <div className="flex items-start gap-2">
                      <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-red-500 shrink-0 w-24 pt-0.5">
                        Sua resposta
                      </span>
                      <span className="font-sans text-xs text-muted leading-snug">
                        {item.chosenText ?? "— em branco —"}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-green-600 shrink-0 w-24 pt-0.5">
                        Correta
                      </span>
                      <span className="font-sans text-xs text-foreground font-medium leading-snug">
                        {item.correctText}
                      </span>
                    </div>
                    {item.explanation && (
                      <div className="flex items-start gap-2 pt-2.5 border-t border-border/60">
                        <Lightbulb className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <p className="font-sans text-xs text-muted leading-relaxed">
                          {item.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>

            <p className="font-sans text-[11px] text-muted mt-4">
              {result.attemptsLeft > 0
                ? "Na próxima tentativa você receberá questões diferentes destas."
                : "Guarde estas explicações — elas resumem os pontos-chave do módulo."}
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
}
