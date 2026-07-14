"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") throw new Error("Não autorizado.");
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function enrollInstructorInCourse(courseId: string, instructorId: string) {
  const instructor = await prisma.instructor.findUnique({
    where: { id: instructorId },
    select: { userId: true },
  });
  if (!instructor) return;

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: instructor.userId, courseId } },
    create: { userId: instructor.userId, courseId, status: "ACTIVE" },
    update: { status: "ACTIVE" },
  });
}

export async function createCourse(formData: FormData) {
  await requireAdmin();

  const title = formData.get("title") as string;
  const instructorId = formData.get("instructorId") as string;
  const baseSlug = slugify(title);

  // ensure unique slug
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.course.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const course = await prisma.course.create({
    data: {
      slug,
      title,
      description:  (formData.get("description") as string) || title,
      price:        parseFloat(formData.get("price") as string) || 0,
      hours:        parseInt(formData.get("hours") as string) || 1,
      status:       "DRAFT",
      category:     (formData.get("category") as "HANDS_ON" | "ONLINE" | "HYBRID") || "ONLINE",
      instructorId,
      thumbnailUrl:        (formData.get("thumbnailUrl") as string) || null,
      contentUrl:          (formData.get("contentUrl") as string) || null,
      externalCheckoutUrl: (formData.get("externalCheckoutUrl") as string) || null,
    },
  });

  await enrollInstructorInCourse(course.id, instructorId);

  revalidatePath("/admin/cursos");
  redirect(`/admin/cursos/${slug}`);
}
