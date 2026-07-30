"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { drawQuizVersion } from "@/lib/quizDraw";

export type ReviewItem = {
  questionId: string;
  text: string;
  chosenOptionId: string | null;
  chosenText: string | null;
  correctOptionId: string;
  correctText: string;
  isRight: boolean;
  /** Justificativa do gabarito — preenchida só nas questões erradas, quando habilitado. */
  explanation: string | null;
};

export type SubmitResult =
  | {
      ok: true;
      score: number;
      total: number;
      passed: boolean;
      passingPct: number;
      attemptsLeft: number;
      review: ReviewItem[];
    }
  | { ok: false; error: string };

export async function submitModuleQuiz(
  quizId: string,
  answers: Record<string, string>, // questionId → optionId escolhido
): Promise<SubmitResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Sessão expirada. Entre novamente." };
  const userId = session.user.id;

  const quiz = await prisma.moduleQuiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!quiz) return { ok: false, error: "Prova não encontrada." };

  const now = new Date();
  if (quiz.availableFrom && now < quiz.availableFrom) {
    return { ok: false, error: "A prova ainda não está disponível." };
  }
  if (quiz.availableUntil && now > quiz.availableUntil) {
    return { ok: false, error: "O prazo para esta prova encerrou." };
  }

  // Precisa ser lido ANTES de gravar a tentativa: é o mesmo estado usado no
  // sorteio da entrega, e é o que garante que a versão corrigida é a versão feita.
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
  if (drawn.length === 0) return { ok: false, error: "Esta prova ainda não tem questões cadastradas." };

  // Rede de proteção: se alguém editar o banco de questões enquanto o aluno faz
  // a prova, o sorteio recomposto aqui pode não bater com o que ele respondeu.
  // Nesse caso vale o que ele efetivamente viu — nunca corrigimos um aluno por
  // questões que não foram apresentadas a ele.
  const answeredIds = Object.keys(answers);
  const drawnIds = new Set(drawn.map((q) => q.id));
  const divergiu = answeredIds.length > 0 && answeredIds.some((id) => !drawnIds.has(id));

  const served = divergiu
    ? answeredIds
        .map((id) => quiz.questions.find((q) => q.id === id))
        .filter((q): q is NonNullable<typeof q> => !!q)
        .map((q) => ({
          id: q.id,
          text: q.text,
          explanation: q.explanation,
          topic: q.topic,
          options: q.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
        }))
    : drawn;

  if (divergiu) {
    console.warn(
      `submitModuleQuiz: banco alterado durante a prova (quiz=${quizId}, user=${userId}). ` +
      `Corrigido pelas ${served.length} questões respondidas.`,
    );
  }

  const review: ReviewItem[] = [];
  let score = 0;

  for (const q of served) {
    const correct = q.options.find((o) => o.isCorrect);
    if (!correct) continue; // questão sem gabarito definido não pontua nem penaliza
    const chosenId = answers[q.id] ?? null;
    const chosen = q.options.find((o) => o.id === chosenId) ?? null;
    const isRight = !!chosenId && chosenId === correct.id;
    if (isRight) score++;

    review.push({
      questionId: q.id,
      text: q.text,
      chosenOptionId: chosen?.id ?? null,
      chosenText: chosen?.text ?? null,
      correctOptionId: correct.id,
      correctText: correct.text,
      isRight,
      explanation: !isRight && quiz.showExplanations ? q.explanation : null,
    });
  }

  const total = review.length;
  const passed = total > 0 && (score / total) * 100 >= quiz.passingPct;

  await prisma.moduleQuizAttempt.create({
    data: {
      quizId,
      userId,
      score,
      total,
      passed,
      answers,
      servedQuestionIds: served.map((q) => q.id),
    },
  });

  return {
    ok: true,
    score,
    total,
    passed,
    passingPct: quiz.passingPct,
    attemptsLeft: quiz.maxAttempts - previous.length - 1,
    review,
  };
}
