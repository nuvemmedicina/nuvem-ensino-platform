"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function confirmPayment(enrollmentId: string) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") throw new Error("Não autorizado.");

  const payment = await prisma.payment.findFirst({
    where: { enrollmentId, status: { not: "PAID" } },
    orderBy: { createdAt: "desc" },
  });
  if (!payment) throw new Error("Nenhum pagamento pendente encontrado.");

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", paidAt: new Date() },
    }),
    prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "ACTIVE" },
    }),
  ]);

  revalidatePath("/admin/matriculas");
  revalidatePath("/admin");
}

export async function cancelEnrollment(enrollmentId: string) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") throw new Error("Não autorizado.");

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, status: true, courseId: true },
  });
  if (!enrollment) throw new Error("Matrícula não encontrada.");
  if (enrollment.status === "CANCELLED") throw new Error("Matrícula já cancelada.");

  const course = await prisma.course.findUnique({
    where: { id: enrollment.courseId },
    select: { reservedSeats: true },
  });

  await prisma.$transaction([
    prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "CANCELLED" },
    }),
    prisma.course.update({
      where: { id: enrollment.courseId },
      data: { reservedSeats: Math.max(0, (course?.reservedSeats ?? 1) - 1) },
    }),
  ]);

  revalidatePath("/admin/matriculas");
}
