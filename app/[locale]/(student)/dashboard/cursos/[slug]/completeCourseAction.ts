"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function completeCourse(courseId: string): Promise<{ certificateId: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    select: {
      id: true,
      status: true,
      course: { select: { contentUrl: true } },
    },
  });
  if (!enrollment) throw new Error("Matrícula não encontrada.");
  if (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED") {
    throw new Error("Matrícula não está ativa.");
  }

  // Concluir por conta própria só vale para curso de link externo, sem aulas
  // na plataforma. Nos demais o certificado depende das aulas e das provas, e
  // a action não pode ser chamada direto para pular essas etapas.
  const lessonCount = await prisma.lesson.count({ where: { module: { courseId } } });
  if (!enrollment.course.contentUrl || lessonCount > 0) {
    throw new Error("Este curso não pode ser concluído manualmente.");
  }

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  const cert = await prisma.certificate.upsert({
    where: { enrollmentId: enrollment.id },
    create: { userId: session.user.id, enrollmentId: enrollment.id },
    update: {},
  });

  return { certificateId: cert.id };
}
