"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireInstructor() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado");
  const role = (session.user as { role?: string }).role;
  if (role !== "INSTRUCTOR" && role !== "ADMIN") throw new Error("Não autorizado");
  const instructor = await prisma.instructor.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!instructor) throw new Error("Perfil de instrutor não encontrado");
  return instructor;
}

async function requireCourseOwnership(courseSlug: string) {
  const instructor = await requireInstructor();
  const course = await prisma.course.findFirst({
    where: { slug: courseSlug, instructorId: instructor.id },
    select: { id: true, slug: true },
  });
  if (!course) throw new Error("Curso não encontrado ou sem permissão");
  return { instructor, course };
}

export async function updateCourseContent(courseId: string, slug: string, formData: FormData) {
  await requireCourseOwnership(slug);

  const str = (key: string) => (formData.get(key) as string) || null;
  const isTranslationsOnly = formData.get("_translationsOnly") === "1";

  if (isTranslationsOnly) {
    await prisma.course.update({
      where: { id: courseId },
      data: {
        titleEn:       str("titleEn"),
        shortDescEn:   str("shortDescEn"),
        descriptionEn: str("descriptionEn"),
        titleEs:       str("titleEs"),
        shortDescEs:   str("shortDescEs"),
        descriptionEs: str("descriptionEs"),
      },
    });
  } else {
    await prisma.course.update({
      where: { id: courseId },
      data: {
        title:       formData.get("title") as string,
        shortDesc:   str("shortDesc"),
        description: formData.get("description") as string,
        titleEn:       str("titleEn"),
        shortDescEn:   str("shortDescEn"),
        descriptionEn: str("descriptionEn"),
        titleEs:       str("titleEs"),
        shortDescEs:   str("shortDescEs"),
        descriptionEs: str("descriptionEs"),
      },
    });
  }

  revalidatePath(`/instrutor/cursos/${slug}`);
  revalidatePath("/instrutor/cursos");
  revalidatePath(`/cursos/${slug}`);
}

export async function updateLesson(lessonId: string, courseSlug: string, formData: FormData) {
  await requireCourseOwnership(courseSlug);
  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      title:    formData.get("title") as string,
      videoUrl: (formData.get("videoUrl") as string) || null,
      duration: formData.get("duration") ? Math.round(parseFloat(formData.get("duration") as string) * 60) : null,
      isFree:   formData.get("isFree") === "on",
    },
  });
  revalidatePath(`/instrutor/cursos/${courseSlug}`);
}

export async function createModule(courseId: string, courseSlug: string, formData: FormData) {
  await requireCourseOwnership(courseSlug);
  const existing = await prisma.module.findMany({ where: { courseId }, select: { order: true } });
  const maxOrder = existing.reduce((m, r) => Math.max(m, r.order), 0);
  await prisma.module.create({
    data: {
      courseId,
      title: formData.get("title") as string,
      order: maxOrder + 1,
    },
  });
  revalidatePath(`/instrutor/cursos/${courseSlug}`);
}

export async function createLesson(moduleId: string, courseSlug: string, formData: FormData) {
  await requireCourseOwnership(courseSlug);
  const existing = await prisma.lesson.findMany({ where: { moduleId }, select: { order: true } });
  const maxOrder = existing.reduce((m, r) => Math.max(m, r.order), 0);
  await prisma.lesson.create({
    data: {
      moduleId,
      title:    formData.get("title") as string,
      videoUrl: (formData.get("videoUrl") as string) || null,
      duration: formData.get("duration") ? Math.round(parseFloat(formData.get("duration") as string) * 60) : null,
      order:    maxOrder + 1,
      type:     "VIDEO",
    },
  });
  revalidatePath(`/instrutor/cursos/${courseSlug}`);
}

export async function deleteLesson(lessonId: string, courseSlug: string) {
  await requireCourseOwnership(courseSlug);
  await prisma.lesson.delete({ where: { id: lessonId } });
  revalidatePath(`/instrutor/cursos/${courseSlug}`);
}

export async function deleteModule(moduleId: string, courseSlug: string) {
  await requireCourseOwnership(courseSlug);
  await prisma.module.delete({ where: { id: moduleId } });
  revalidatePath(`/instrutor/cursos/${courseSlug}`);
}

export async function saveMuxAsset(lessonId: string, muxAssetId: string, courseSlug: string) {
  await requireCourseOwnership(courseSlug);
  await prisma.lesson.update({
    where: { id: lessonId },
    data: { muxAssetId },
  });
  revalidatePath(`/instrutor/cursos/${courseSlug}`);
}
