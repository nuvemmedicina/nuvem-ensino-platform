"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function submitModuleQuiz(
  quizId: string,
  answers: Record<string, string>, // questionId → optionId escolhido
): Promise<{ score: number; total: number; passed: boolean; attemptsLeft: number; correct: Record<string, string> }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");

  const quiz = await prisma.moduleQuiz.findUnique({
    where: { id: quizId },
    include: { questions: { include: { options: true }, orderBy: { order: "asc" } } },
  });
  if (!quiz) throw new Error("Prova não encontrada.");

  // Verifica janela de disponibilidade
  const now = new Date();
  if (quiz.availableFrom && now < quiz.availableFrom) throw new Error("A prova ainda não está disponível.");
  if (quiz.availableUntil && now > quiz.availableUntil) throw new Error("O prazo para esta prova encerrou.");

  // Conta tentativas anteriores
  const prevAttempts = await prisma.moduleQuizAttempt.count({
    where: { quizId, userId: session.user.id },
  });
  if (prevAttempts >= quiz.maxAttempts) throw new Error("Número máximo de tentativas atingido.");

  // Corrige
  const correct: Record<string, string> = {};
  let score = 0;
  for (const q of quiz.questions) {
    const correctOpt = q.options.find((o) => o.isCorrect);
    if (correctOpt) correct[q.id] = correctOpt.id;
    if (answers[q.id] && answers[q.id] === correctOpt?.id) score++;
  }

  const total = quiz.questions.length;
  const passed = total > 0 && (score / total) * 100 >= quiz.passingPct;

  await prisma.moduleQuizAttempt.create({
    data: { quizId, userId: session.user.id, score, total, passed, answers },
  });

  return { score, total, passed, attemptsLeft: quiz.maxAttempts - prevAttempts - 1, correct };
}
