"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createLiveSession(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  const courseId   = formData.get("courseId") as string;
  const title      = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const startAt    = new Date(formData.get("startAt") as string);
  const endAt      = new Date(formData.get("endAt") as string);
  const meetUrl    = (formData.get("meetUrl") as string) || null;
  const location   = (formData.get("location") as string) || null;

  await prisma.liveSession.create({
    data: { courseId, title, description, startAt, endAt, meetUrl, location },
  });

  revalidatePath("/admin/aulas-ao-vivo");
}

export async function updateLiveSession(id: string, formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.liveSession.update({
    where: { id },
    data: {
      title:       formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      startAt:     new Date(formData.get("startAt") as string),
      endAt:       new Date(formData.get("endAt") as string),
      meetUrl:     (formData.get("meetUrl") as string) || null,
      location:    (formData.get("location") as string) || null,
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
