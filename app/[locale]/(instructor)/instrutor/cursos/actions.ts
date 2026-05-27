"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireInstructor() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado");
  const role = (session.user as { role?: string }).role;
  if (role !== "INSTRUCTOR" && role !== "ADMIN") throw new Error("Não autorizado");
  const instructor = await prisma.instructor.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!instructor) throw new Error("Perfil de instrutor não encontrado");
  return instructor;
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createCourse(formData: FormData) {
  const instructor = await requireInstructor();

  const title    = (formData.get("title") as string).trim();
  const category = (formData.get("category") as string) || "ONLINE";
  if (!title) throw new Error("Título obrigatório");

  const baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.course.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  await prisma.course.create({
    data: {
      title,
      slug,
      category: category as "HANDS_ON" | "ONLINE" | "HYBRID",
      instructorId: instructor.id,
      status: "DRAFT",
      price: 0,
      hours: 0,
      description: "",
    },
  });

  revalidatePath("/instrutor/cursos");
  redirect(`/instrutor/cursos/${slug}`);
}
