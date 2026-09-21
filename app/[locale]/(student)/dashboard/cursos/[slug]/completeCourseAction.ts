"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function completeCourse(courseId: string): Promise<{ certificateId: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    select: { id: true, status: true },
  });
  if (!enrollment) throw new Error("Matrícula não encontrada.");

  // Mesma checagem do fluxo automático em /api/progress: só emite o
  // certificado se todas as aulas obrigatórias do curso já estiverem
  // marcadas como concluídas. Cursos sem aulas estruturadas (conteúdo
  // externo via contentUrl) têm totalLessons = 0 e passam direto.
  const totalLessons = await prisma.lesson.count({
    where: { module: { courseId } },
  });
  if (totalLessons > 0) {
    const completedLessons = await prisma.progress.count({
      where: { enrollmentId: enrollment.id, completed: true },
    });
    if (completedLessons < totalLessons) {
      throw new Error("Conclua todas as aulas do curso antes de gerar o certificado.");
    }
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
