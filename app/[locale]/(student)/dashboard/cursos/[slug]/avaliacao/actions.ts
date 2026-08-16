"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Notas dos docentes. Cada docente é opcional: o aluno avalia quem quiser, e
 * quem ficar sem estrela não vira registro (nem apaga nota anterior — para
 * apagar, o aluno não tem caminho hoje; é decisão de produto, não esquecimento).
 */
export async function submitInstructorEvaluations(
  courseId: string,
  courseSlug: string,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado");

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    select: { status: true },
  });
  if (!enrollment || (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED")) {
    throw new Error("Você não está matriculado neste curso");
  }

  // Só aceita docentes que realmente dão aula no curso — o formulário vem do
  // navegador e os ids podem ser trocados.
  const doDoCurso = await prisma.instructor.findMany({
    where: {
      OR: [
        { lessonInstructors: { some: { lesson: { module: { courseId } } } } },
        { modules: { some: { module: { courseId } } } },
        { courses: { some: { id: courseId } } },
      ],
    },
    select: { id: true },
  });
  const permitidos = new Set(doDoCurso.map((i) => i.id));

  for (const [chave, valor] of formData.entries()) {
    if (!chave.startsWith("rating:")) continue;
    const instructorId = chave.slice("rating:".length);
    if (!permitidos.has(instructorId)) continue;

    const rating = Number(valor);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) continue; // sem nota = não avaliou

    const suggestion =
      (formData.get(`suggestion:${instructorId}`) as string | null)?.trim() || null;

    await prisma.instructorEvaluation.upsert({
      where: { userId_instructorId_courseId: { userId: session.user.id, instructorId, courseId } },
      create: { userId: session.user.id, instructorId, courseId, rating, suggestion },
      update: { rating, suggestion },
    });
  }

  revalidatePath(`/dashboard/cursos/${courseSlug}/avaliacao`);
}

export async function submitEvaluation(courseId: string, courseSlug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado");

  const overallRating  = Number(formData.get("overallRating"));
  const contentRating  = Number(formData.get("contentRating"));
  const platformRating = Number(formData.get("platformRating"));
  const wouldRecommend = formData.get("wouldRecommend") === "true";
  const highlight      = (formData.get("highlight") as string | null)?.trim() || null;
  const suggestion     = (formData.get("suggestion") as string | null)?.trim() || null;

  for (const r of [overallRating, contentRating, platformRating]) {
    if (!Number.isInteger(r) || r < 1 || r > 5) throw new Error("Nota inválida");
  }

  await prisma.courseEvaluation.upsert({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    create: {
      courseId,
      userId: session.user.id,
      overallRating,
      contentRating,
      platformRating,
      wouldRecommend,
      highlight,
      suggestion,
    },
    update: {
      overallRating,
      contentRating,
      platformRating,
      wouldRecommend,
      highlight,
      suggestion,
    },
  });

  revalidatePath(`/dashboard/cursos/${courseSlug}/avaliacao`);
}
