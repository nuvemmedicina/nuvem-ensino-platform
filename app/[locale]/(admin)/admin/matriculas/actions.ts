"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sincronizarVagas } from "@/lib/vagas";
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

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status: "CANCELLED" },
  });
  await sincronizarVagas(prisma, enrollment.courseId);

  revalidatePath("/admin/matriculas");
}

/**
 * Emite o certificado de uma matrícula e a marca como concluída. É o caminho
 * dos cursos presenciais, que não têm aulas na plataforma: antes o
 * certificado saía sozinho na confirmação do pagamento, inclusive nos cursos
 * online (que agora só emitem quando o aluno conclui).
 */
export async function emitirCertificado(enrollmentId: string) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") throw new Error("Não autorizado.");

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, userId: true, status: true },
  });
  if (!enrollment) throw new Error("Matrícula não encontrada.");
  if (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED") {
    throw new Error("Só dá para emitir certificado de matrícula ativa ou concluída.");
  }

  await prisma.$transaction([
    prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    }),
    prisma.certificate.upsert({
      where: { enrollmentId: enrollment.id },
      create: { userId: enrollment.userId, enrollmentId: enrollment.id },
      update: {},
    }),
  ]);

  revalidatePath("/admin/matriculas");
}
