"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AttendanceStatus } from "@/app/generated/prisma/client";

export async function markAttendance(
  enrollmentId: string,
  courseSlug: string,
  date: string, // ISO date string "YYYY-MM-DD"
  status: AttendanceStatus,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");

  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") throw new Error("Sem permissão.");

  // date as a bare PostgreSQL DATE — store at midnight UTC
  const dateObj = new Date(`${date}T00:00:00.000Z`);

  await prisma.attendance.upsert({
    where: { enrollmentId_date: { enrollmentId, date: dateObj } },
    create: {
      enrollmentId,
      date: dateObj,
      status,
      markedById: session.user.id,
    },
    update: {
      status,
      markedById: session.user.id,
      markedAt: new Date(),
    },
  });

  revalidatePath(`/admin/cursos/${courseSlug}/inscritos`);
}
