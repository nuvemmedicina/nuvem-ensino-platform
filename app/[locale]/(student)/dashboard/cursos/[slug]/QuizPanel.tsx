"use client";

import { useState, useTransition } from "react";
import { submitQuiz } from "./quizActions";

type Option = {
  id: string;
  text: string;
  order: number;
};

type Question = {
  id: string;
  text: string;
  order: number;
  options: Option[];
};

type QuizPanelProps = {
  quiz: {
    id: string;
    title: string;
    questions: Question[];
  };
  previousAttempt: { score: number; total: number } | null;
};

export default function QuizPanel({ quiz, previousAttempt }: QuizPanelProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    score: number;
    total: number;
    feedback: Record<string, boolean>;
  } | null>(null);
  const [showQuiz, setShowQuiz] = useState(!previousAttempt);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSelect(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const unanswered = quiz.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setError(`Responda todas as perguntas antes de enviar (${unanswered.length} sem resposta).`);
      return;
    }

    startTransition(async () => {
      try {
        const res = await submitQuiz(quiz.id, answers);
        setResult(res);
        setShowQuiz(false);
      } catch {
        setError("Erro ao enviar o quiz. Tente novamente.");
      }
    });
  }

  function handleRetry() {
    setAnswers({});
    setResult(null);
    setShowQuiz(true);
    setError(null);
  }

  const displayAttempt = result ?? previousAttempt;
  const pct = displayAttempt ? Math.round((displayAttempt.score / displayAttempt.total) * 100) : 0;

  return (
    <div className="border-t border-border bg-surface px-6 py-6">
      <div className="max-w-2xl">
        <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted mb-1">
          Quiz
        </p>
        <h2 className="font-serif text-lg font-medium text-foreground mb-4">{quiz.title}</h2>

        {/* Result view */}
        {!showQuiz && displayAttempt && (
          <div className="space-y-4">
            <div
              className={`rounded-xl px-5 py-4 border ${
                pct >= 70
                  ? "bg-green-500/10 border-green-500/20 text-green-700"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-700"
              }`}
            >
              <p className="font-sans text-sm font-semibold">
                {displayAttempt.score} de {displayAttempt.total} corretas — {pct}%
              </p>
              <p className="font-sans text-xs mt-0.5">
                {pct >= 70 ? "Parabéns! Você foi bem no quiz." : "Continue estudando e tente novamente."}
              </p>
            </div>

            {/* Feedback per question (only available after this session's submission) */}
            {result && (
              <div className="space-y-3">
                {quiz.questions.map((question) => {
                  const isCorrect = result.feedback[question.id];
                  const selectedId = answers[question.id];

                  return (
                    <div
                      key={question.id}
                      className={`rounded-lg border p-3 ${
                        isCorrect ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                      }`}
                    >
                      <p className="font-sans text-xs font-semibold text-foreground mb-2">
                        {question.order}. {question.text}
                      </p>
                      <div className="space-y-1">
                        {question.options.map((opt) => {
                          const isSelected = opt.id === selectedId;
                          return (
                            <div
                              key={opt.id}
                              className={`font-sans text-xs px-2 py-1 rounded ${
                                isSelected && isCorrect
                                  ? "bg-green-500/20 text-green-700 font-semibold"
                                  : isSelected && !isCorrect
                                  ? "bg-red-500/20 text-red-700 font-semibold"
                                  : "text-muted"
                              }`}
                            >
                              {isSelected ? (isCorrect ? "✓ " : "✗ ") : "○ "}
                              {opt.text}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={handleRetry}
              className="font-sans text-sm font-semibold px-4 py-2 rounded-lg border border-border text-muted hover:border-primary/40 hover:text-foreground transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Quiz form */}
        {showQuiz && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {quiz.questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <p className="font-sans text-sm font-semibold text-foreground">
                  {question.order}. {question.text}
                </p>
                <div className="space-y-1.5 pl-1">
                  {question.options.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all font-sans text-sm ${
                        answers[question.id] === opt.id
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border text-muted hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${question.id}`}
                        value={opt.id}
                        checked={answers[question.id] === opt.id}
                        onChange={() => handleSelect(question.id, opt.id)}
                        className="accent-primary shrink-0"
                      />
                      {opt.text}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {error && (
              <p className="font-sans text-xs text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="font-sans text-sm font-semibold px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {isPending ? "Enviando…" : "Enviar respostas"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
