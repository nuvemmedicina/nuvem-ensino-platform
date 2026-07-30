"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "EDITOR")) redirect("/entrar");
}

export async function createModuleQuiz(moduleId: string, courseSlug: string) {
  await requireAdmin();
  await prisma.moduleQuiz.upsert({
    where: { moduleId },
    create: { moduleId, title: "Prova do Módulo" },
    update: {},
  });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function updateModuleQuiz(quizId: string, courseSlug: string, formData: FormData) {
  await requireAdmin();

  const num = (key: string) => {
    const raw = (formData.get(key) as string | null)?.trim();
    if (!raw) return null;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  };

  const title = formData.get("title") as string;
  const availableFrom = formData.get("availableFrom") as string;
  const availableUntil = formData.get("availableUntil") as string;

  const passingPct = num("passingPct");
  const maxAttempts = num("maxAttempts");
  const perAttempt = num("questionsPerAttempt");

  await prisma.moduleQuiz.update({
    where: { id: quizId },
    data: {
      title,
      availableFrom: availableFrom ? new Date(availableFrom) : null,
      availableUntil: availableUntil ? new Date(availableUntil) : null,
      ...(passingPct !== null && { passingPct: Math.min(100, Math.max(1, passingPct)) }),
      ...(maxAttempts !== null && { maxAttempts: Math.max(1, maxAttempts) }),
      // Vazio = entrega todas as questões cadastradas.
      questionsPerAttempt: perAttempt !== null ? Math.max(1, perAttempt) : null,
      shuffleQuestions: formData.get("shuffleQuestions") === "on",
      shuffleOptions: formData.get("shuffleOptions") === "on",
      avoidRepeats: formData.get("avoidRepeats") === "on",
      showExplanations: formData.get("showExplanations") === "on",
    },
  });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function deleteModuleQuiz(quizId: string, courseSlug: string) {
  await requireAdmin();
  await prisma.moduleQuiz.delete({ where: { id: quizId } });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function addModuleQuizQuestion(quizId: string, courseSlug: string, formData: FormData) {
  await requireAdmin();
  const text = formData.get("text") as string;
  if (!text?.trim()) return;
  const last = await prisma.moduleQuizQuestion.findFirst({
    where: { quizId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const explanation = (formData.get("explanation") as string | null)?.trim() || null;
  const topic = (formData.get("topic") as string | null)?.trim() || null;
  await prisma.moduleQuizQuestion.create({
    data: { quizId, text: text.trim(), explanation, topic, order: (last?.order ?? -1) + 1 },
  });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

/** Edita a justificativa do gabarito, mostrada ao aluno que errou a questão. */
export async function updateModuleQuizQuestion(questionId: string, courseSlug: string, formData: FormData) {
  await requireAdmin();
  const explanation = (formData.get("explanation") as string | null)?.trim() || null;
  await prisma.moduleQuizQuestion.update({
    where: { id: questionId },
    data: { explanation },
  });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function deleteModuleQuizQuestion(questionId: string, courseSlug: string) {
  await requireAdmin();
  await prisma.moduleQuizQuestion.delete({ where: { id: questionId } });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function addModuleQuizOption(questionId: string, courseSlug: string, formData: FormData) {
  await requireAdmin();
  const text = formData.get("text") as string;
  const isCorrect = formData.get("isCorrect") === "on";
  if (!text?.trim()) return;
  const last = await prisma.moduleQuizOption.findFirst({
    where: { questionId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  // Se marcar como correta, desmarca as outras
  if (isCorrect) {
    await prisma.moduleQuizOption.updateMany({ where: { questionId }, data: { isCorrect: false } });
  }
  await prisma.moduleQuizOption.create({
    data: { questionId, text: text.trim(), isCorrect, order: (last?.order ?? -1) + 1 },
  });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function setCorrectOption(optionId: string, questionId: string, courseSlug: string) {
  await requireAdmin();
  await prisma.moduleQuizOption.updateMany({ where: { questionId }, data: { isCorrect: false } });
  await prisma.moduleQuizOption.update({ where: { id: optionId }, data: { isCorrect: true } });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function deleteModuleQuizOption(optionId: string, courseSlug: string) {
  await requireAdmin();
  await prisma.moduleQuizOption.delete({ where: { id: optionId } });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}
