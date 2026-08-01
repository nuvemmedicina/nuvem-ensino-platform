"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createPasswordResetToken } from "@/lib/tokens";
import { sendSetPasswordEmail, sendPasswordResetEmail } from "@/lib/email";
import { APP_URL } from "@/lib/appUrl";

export async function updateUser(
  userId: string,
  formData: FormData
) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") throw new Error("Não autorizado.");

  const name  = (formData.get("name")  as string).trim() || null;
  const email = (formData.get("email") as string).trim().toLowerCase();

  if (!email) throw new Error("E-mail é obrigatório.");

  // Check email uniqueness (excluding current user)
  const conflict = await prisma.user.findFirst({
    where: { email, NOT: { id: userId } },
    select: { id: true },
  });
  if (conflict) throw new Error("Este e-mail já está em uso por outra conta.");

  await prisma.user.update({
    where: { id: userId },
    data: { name, email },
  });

  revalidatePath("/admin/usuarios");
}

const VALIDADE_HORAS = 24 * 7;

/**
 * Gera um novo link de acesso para o aluno e tenta enviá-lo por e-mail.
 *
 * O link volta para a tela mesmo quando o envio falha: é justamente aí que o
 * admin precisa dele para repassar por WhatsApp. Validade de 7 dias porque o
 * repasse é manual e raramente acontece no mesmo minuto.
 */
export async function resendAccessLink(userId: string): Promise<{
  link: string;
  emailSent: boolean;
  emailError: string | null;
}> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") throw new Error("Não autorizado.");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      passwordHash: true,
      enrollments: {
        where: { status: { not: "CANCELLED" } },
        orderBy: { enrolledAt: "desc" },
        take: 1,
        select: { course: { select: { title: true } } },
      },
    },
  });
  if (!user?.email) throw new Error("Usuário não encontrado.");

  const token = await createPasswordResetToken(user.email, VALIDADE_HORAS);
  const link = `${APP_URL}/resetar-senha?token=${token}`;
  const userName = user.name ?? "Aluno";
  const curso = user.enrollments[0]?.course.title;

  // Quem nunca definiu senha recebe o e-mail de primeiro acesso; quem já tem
  // senha recebe o de redefinição, que é o que a situação dele realmente é.
  const result =
    !user.passwordHash && curso
      ? await sendSetPasswordEmail({
          to: user.email,
          userName,
          courseName: curso,
          token,
          expiresLabel: "7 dias",
        })
      : await sendPasswordResetEmail({ to: user.email, userName, token });

  revalidatePath("/admin/usuarios");

  return {
    link,
    emailSent: result.ok,
    emailError: result.ok ? null : result.error,
  };
}

export async function changeUserRole(
  userId: string,
  newRole: "STUDENT" | "INSTRUCTOR" | "EDITOR" | "ADMIN"
) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") throw new Error("Não autorizado.");

  // Prevent removing your own admin access
  if (userId === session.user.id) throw new Error("Não é possível alterar o próprio papel.");

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  revalidatePath("/admin/usuarios");
}
