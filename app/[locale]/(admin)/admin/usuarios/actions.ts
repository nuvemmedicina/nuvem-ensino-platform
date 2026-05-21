"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
