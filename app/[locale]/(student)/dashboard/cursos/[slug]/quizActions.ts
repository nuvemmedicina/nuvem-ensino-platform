"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function submitQuiz(
  quizId: string,
  answers: Record<string, string>
): Promise<{ score: number; total: number; feedback: Record<string, boolean> }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        include: { options: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!quiz) throw new Error("Quiz não encontrado.");

  const feedback: Record<string, boolean> = {};
  let score = 0;

  for (const question of quiz.questions) {
    const selectedOptionId = answers[question.id];
    const correctOption = question.options.find((o) => o.isCorrect);
    const isCorrect = Boolean(selectedOptionId && correctOption && selectedOptionId === correctOption.id);
    feedback[question.id] = isCorrect;
    if (isCorrect) score++;
  }

  const total = quiz.questions.length;

  await prisma.quizAttempt.create({
    data: {
      userId: session.user.id,
      quizId,
      score,
      total,
      answers: answers as object,
    },
  });

  return { score, total, feedback };
}
