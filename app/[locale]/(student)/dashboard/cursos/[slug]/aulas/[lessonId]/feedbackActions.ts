"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Joinha do fim da aula. Volta o estado gravado em vez de lançar erro para o
 * aluno: se isto falhar, não pode atrapalhar quem só queria estudar.
 */
export async function salvarFeedbackAula(
  lessonId: string,
  useful: boolean,
  suggestion?: string | null,
): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false };

  // Só quem tem matrícula ativa no curso da aula.
  const aula = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  });
  if (!aula) return { ok: false };

  const matricula = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: aula.module.courseId } },
    select: { status: true },
  });
  if (!matricula || (matricula.status !== "ACTIVE" && matricula.status !== "COMPLETED")) {
    return { ok: false };
  }

  const texto = suggestion?.trim() || null;

  await prisma.lessonFeedback.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    create: { userId: session.user.id, lessonId, useful, suggestion: texto },
    // Sem texto novo, mantém o que o aluno já tinha escrito.
    update: { useful, ...(texto !== null ? { suggestion: texto } : {}) },
  });

  return { ok: true };
}
