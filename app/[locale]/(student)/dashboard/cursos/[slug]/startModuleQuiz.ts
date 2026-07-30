"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { drawQuizVersion } from "@/lib/quizDraw";

export type StartedQuiz = {
  questions: { id: string; text: string; options: { id: string; text: string }[] }[];
  attemptsLeft: number;
};

export type StartResult = { ok: true; quiz: StartedQuiz } | { ok: false; error: string };

/**
 * Entrega a versão sorteada da prova para o aluno.
 *
 * Nada é gravado aqui: o sorteio é determinístico e será recomposto na correção.
 * Assim, abrir a prova e desistir não consome tentativa.
 */
export async function startModuleQuiz(quizId: string): Promise<StartResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Sessão expirada. Entre novamente." };
  const userId = session.user.id;

  const quiz = await prisma.moduleQuiz.findUnique({
    where: { id: quizId },
    include: {
      module: { select: { releaseDate: true, title: true } },
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!quiz) return { ok: false, error: "Prova não encontrada." };

  const now = new Date();

  // A prova abre junto com o módulo a que pertence.
  if (quiz.module.releaseDate && now < quiz.module.releaseDate) {
    return { ok: false, error: "Esta prova abre junto com as aulas do módulo." };
  }
  if (quiz.availableFrom && now < quiz.availableFrom) {
    return { ok: false, error: "A prova ainda não está disponível." };
  }
  if (quiz.availableUntil && now > quiz.availableUntil) {
    return { ok: false, error: "O prazo para esta prova encerrou." };
  }

  const previous = await prisma.moduleQuizAttempt.findMany({
    where: { quizId, userId },
    orderBy: { createdAt: "asc" },
    select: { passed: true, servedQuestionIds: true },
  });

  if (previous.length >= quiz.maxAttempts) {
    return { ok: false, error: "Você já usou todas as tentativas desta prova." };
  }
  if (previous.some((a) => a.passed)) {
    return { ok: false, error: "Você já foi aprovado nesta prova." };
  }
  if (quiz.questions.length === 0) {
    return { ok: false, error: "Esta prova ainda não tem questões cadastradas." };
  }

  const drawn = drawQuizVersion(quiz.questions, {
    userId,
    quizId,
    attemptIndex: previous.length,
    perAttempt: quiz.questionsPerAttempt,
    shuffleQuestions: quiz.shuffleQuestions,
    shuffleOptions: quiz.shuffleOptions,
    avoidRepeats: quiz.avoidRepeats,
    seenQuestionIds: previous.flatMap((a) => a.servedQuestionIds),
  });

  // O gabarito nunca vai para o navegador.
  return {
    ok: true,
    quiz: {
      questions: drawn.map((q) => ({
        id: q.id,
        text: q.text,
        options: q.options.map((o) => ({ id: o.id, text: o.text })),
      })),
      attemptsLeft: quiz.maxAttempts - previous.length - 1,
    },
  };
}
