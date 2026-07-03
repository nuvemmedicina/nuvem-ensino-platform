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
