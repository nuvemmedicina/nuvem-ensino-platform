"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitEvaluation(courseId: string, courseSlug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado");

  const overallRating    = Number(formData.get("overallRating"));
  const contentRating    = Number(formData.get("contentRating"));
  const instructorRating = Number(formData.get("instructorRating"));
  const platformRating   = Number(formData.get("platformRating"));
  const wouldRecommend   = formData.get("wouldRecommend") === "true";
  const highlight        = (formData.get("highlight") as string | null)?.trim() || null;
  const suggestion       = (formData.get("suggestion") as string | null)?.trim() || null;

  for (const r of [overallRating, contentRating, instructorRating, platformRating]) {
    if (!Number.isInteger(r) || r < 1 || r > 5) throw new Error("Nota inválida");
  }

  await prisma.courseEvaluation.upsert({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    create: {
      courseId,
      userId: session.user.id,
      overallRating,
      contentRating,
      instructorRating,
      platformRating,
      wouldRecommend,
      highlight,
      suggestion,
    },
    update: {
      overallRating,
      contentRating,
      instructorRating,
      platformRating,
      wouldRecommend,
      highlight,
      suggestion,
    },
  });

  revalidatePath(`/dashboard/cursos/${courseSlug}/avaliacao`);
}
