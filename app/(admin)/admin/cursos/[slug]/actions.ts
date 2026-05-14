"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") throw new Error("Não autorizado.");
}

export async function updateCourse(courseId: string, slug: string, formData: FormData) {
  await requireAdmin();
  await prisma.course.update({
    where: { id: courseId },
    data: {
      title:       formData.get("title") as string,
      shortDesc:   (formData.get("shortDesc") as string) || null,
      description: formData.get("description") as string,
      price:       parseFloat(formData.get("price") as string),
      hours:       parseInt(formData.get("hours") as string),
      status:      formData.get("status") as "DRAFT" | "PUBLISHED" | "ARCHIVED",
      category:    formData.get("category") as "HANDS_ON" | "ONLINE" | "HYBRID",
      location:    (formData.get("location") as string) || null,
      thumbnailUrl: (formData.get("thumbnailUrl") as string) || null,
    },
  });
  revalidatePath(`/admin/cursos/${slug}`);
  revalidatePath("/admin/cursos");
  revalidatePath(`/cursos/${slug}`);
}

export async function updateLesson(lessonId: string, courseSlug: string, formData: FormData) {
  await requireAdmin();
  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      title:    formData.get("title") as string,
      videoUrl: (formData.get("videoUrl") as string) || null,
      duration: formData.get("duration") ? parseInt(formData.get("duration") as string) : null,
      isFree:   formData.get("isFree") === "on",
    },
  });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function createModule(courseId: string, courseSlug: string, formData: FormData) {
  await requireAdmin();
  const existing = await prisma.module.findMany({ where: { courseId }, select: { order: true } });
  const maxOrder = existing.reduce((m, r) => Math.max(m, r.order), 0);
  await prisma.module.create({
    data: {
      courseId,
      title: formData.get("title") as string,
      order: maxOrder + 1,
    },
  });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function createLesson(moduleId: string, courseSlug: string, formData: FormData) {
  await requireAdmin();
  const existing = await prisma.lesson.findMany({ where: { moduleId }, select: { order: true } });
  const maxOrder = existing.reduce((m, r) => Math.max(m, r.order), 0);
  await prisma.lesson.create({
    data: {
      moduleId,
      title:    formData.get("title") as string,
      videoUrl: (formData.get("videoUrl") as string) || null,
      duration: formData.get("duration") ? parseInt(formData.get("duration") as string) : null,
      order:    maxOrder + 1,
      type:     "VIDEO",
    },
  });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function deleteLesson(lessonId: string, courseSlug: string) {
  await requireAdmin();
  await prisma.lesson.delete({ where: { id: lessonId } });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function deleteModule(moduleId: string, courseSlug: string) {
  await requireAdmin();
  await prisma.module.delete({ where: { id: moduleId } });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}
