"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") throw new Error("Não autorizado.");
}

export async function createQuiz(lessonId: string, courseSlug: string, formData: FormData) {
  await requireAdmin();
  await prisma.quiz.create({
    data: {
      lessonId,
      title: (formData.get("title") as string) || "Quiz",
    },
  });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function addQuestion(quizId: string, courseSlug: string, formData: FormData) {
  await requireAdmin();
  const existing = await prisma.question.findMany({ where: { quizId }, select: { order: true } });
  const maxOrder = existing.reduce((m, r) => Math.max(m, r.order), 0);
  await prisma.question.create({
    data: {
      quizId,
      text: formData.get("text") as string,
      order: maxOrder + 1,
    },
  });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function addOption(questionId: string, courseSlug: string, formData: FormData) {
  await requireAdmin();
  const existing = await prisma.option.findMany({ where: { questionId }, select: { order: true } });
  const maxOrder = existing.reduce((m, r) => Math.max(m, r.order), 0);
  await prisma.option.create({
    data: {
      questionId,
      text: formData.get("text") as string,
      isCorrect: formData.get("isCorrect") === "on",
      order: maxOrder + 1,
    },
  });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function deleteQuiz(quizId: string, courseSlug: string) {
  await requireAdmin();
  await prisma.quiz.delete({ where: { id: quizId } });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function deleteQuestion(questionId: string, courseSlug: string) {
  await requireAdmin();
  await prisma.question.delete({ where: { id: questionId } });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}
