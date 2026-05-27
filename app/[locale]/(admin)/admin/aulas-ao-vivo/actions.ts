"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// O Vercel roda em UTC. O horário inserido é no fuso de Brasília (UTC-3).
// Para converter BRT → UTC: adicionar 3 horas.
function parseBRT(dateStr: string, timeStr: string): Date {
  // Monta "YYYY-MM-DDTHH:MM:00Z" (tratado como UTC) e soma 3h para obter o UTC real do BRT
  const dt = new Date(`${dateStr}T${timeStr}:00Z`);
  dt.setUTCHours(dt.getUTCHours() + 3);
  return dt;
}

export async function createLiveSession(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  const courseId    = formData.get("courseId") as string;
  const title       = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const date        = formData.get("date") as string;
  const startTime   = formData.get("startTime") as string;
  const endTime     = formData.get("endTime") as string;
  const meetUrl     = (formData.get("meetUrl") as string) || null;
  const location    = (formData.get("location") as string) || null;

  const startAt = parseBRT(date, startTime);
  const endAt   = parseBRT(date, endTime);

  await prisma.liveSession.create({
    data: { courseId, title, description, startAt, endAt, meetUrl, location },
  });

  revalidatePath("/admin/aulas-ao-vivo");
}

export async function updateLiveSession(id: string, formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  const date      = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime   = formData.get("endTime") as string;

  await prisma.liveSession.update({
    where: { id },
    data: {
      title:        formData.get("title") as string,
      description:  (formData.get("description") as string) || null,
      startAt:      parseBRT(date, startTime),
      endAt:        parseBRT(date, endTime),
      meetUrl:      (formData.get("meetUrl") as string) || null,
      location:     (formData.get("location") as string) || null,
      recordingUrl: (formData.get("recordingUrl") as string) || null,
    },
  });

  revalidatePath("/admin/aulas-ao-vivo");
}

export async function deleteLiveSession(id: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.liveSession.delete({ where: { id } });
  revalidatePath("/admin/aulas-ao-vivo");
}
