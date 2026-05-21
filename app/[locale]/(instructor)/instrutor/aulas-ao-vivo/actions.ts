"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireInstructor() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado");
  const role = (session.user as { role?: string }).role;
  if (role !== "INSTRUCTOR") throw new Error("Não autorizado");
  const instructor = await prisma.instructor.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!instructor) throw new Error("Perfil de instrutor não encontrado");
  return instructor;
}

async function requireLiveSessionOwnership(liveSessionId: string) {
  const instructor = await requireInstructor();
  // Verify the live session belongs to one of the instructor's courses
  const liveSession = await prisma.liveSession.findFirst({
    where: {
      id: liveSessionId,
      course: { instructorId: instructor.id },
    },
    select: { id: true },
  });
  if (!liveSession) throw new Error("Aula ao vivo não encontrada ou sem permissão");
  return { instructor, liveSession };
}

export async function createLiveSession(formData: FormData) {
  const instructor = await requireInstructor();

  const courseId = formData.get("courseId") as string;
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const startAt = new Date(formData.get("startAt") as string);
  const endAt = new Date(formData.get("endAt") as string);
  const meetUrl = (formData.get("meetUrl") as string) || null;
  const location = (formData.get("location") as string) || null;

  // Verify the course belongs to this instructor
  const course = await prisma.course.findFirst({
    where: { id: courseId, instructorId: instructor.id },
    select: { id: true },
  });
  if (!course) throw new Error("Curso não encontrado ou sem permissão");

  await prisma.liveSession.create({
    data: { courseId, title, description, startAt, endAt, meetUrl, location },
  });

  revalidatePath("/instrutor/aulas-ao-vivo");
}

export async function updateLiveSession(id: string, formData: FormData) {
  await requireLiveSessionOwnership(id);

  await prisma.liveSession.update({
    where: { id },
    data: {
      title:        formData.get("title") as string,
      description:  (formData.get("description") as string) || null,
      startAt:      new Date(formData.get("startAt") as string),
      endAt:        new Date(formData.get("endAt") as string),
      meetUrl:      (formData.get("meetUrl") as string) || null,
      location:     (formData.get("location") as string) || null,
      recordingUrl: (formData.get("recordingUrl") as string) || null,
    },
  });

  revalidatePath("/instrutor/aulas-ao-vivo");
}

export async function deleteLiveSession(id: string) {
  await requireLiveSessionOwnership(id);
  await prisma.liveSession.delete({ where: { id } });
  revalidatePath("/instrutor/aulas-ao-vivo");
}
