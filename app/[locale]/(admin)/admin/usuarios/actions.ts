"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

export async function changeUserRole(
  userId: string,
  newRole: "STUDENT" | "INSTRUCTOR" | "ADMIN"
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
