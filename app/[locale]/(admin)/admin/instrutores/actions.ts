"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") throw new Error("Não autorizado.");
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createInstructor(formData: FormData) {
  await requireAdmin();

  const email    = formData.get("email") as string;
  const title    = (formData.get("title") as string) || null;
  const crm      = (formData.get("crm") as string) || null;
  const rqe      = (formData.get("rqe") as string) || null;
  const photoUrl = (formData.get("photoUrl") as string) || null;

  // Busca o usuário pelo e-mail
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, role: true },
  });
  if (!user) throw new Error(`Usuário com e-mail "${email}" não encontrado.`);

  // Verifica se já tem perfil de instrutor
  const existing = await prisma.instructor.findUnique({ where: { userId: user.id } });
  if (existing) throw new Error("Este usuário já tem um perfil de instrutor.");

  // Gera slug único a partir do nome
  const baseSlug = slugify(user.name ?? email.split("@")[0]);
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.instructor.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  // Cria perfil + muda role para INSTRUCTOR
  await prisma.$transaction([
    prisma.instructor.create({
      data: { userId: user.id, slug, title, crm, rqe, photoUrl },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { role: "INSTRUCTOR" },
    }),
  ]);

  revalidatePath("/admin/instrutores");
}

export async function updateInstructor(instructorId: string, formData: FormData) {
  await requireAdmin();

  const str = (key: string) => (formData.get(key) as string) || null;

  await prisma.instructor.update({
    where: { id: instructorId },
    data: {
      title:       str("title"),
      crm:         str("crm"),
      rqe:         str("rqe"),
      photoUrl:    str("photoUrl"),
      bio:         str("bio"),
      formation:   str("formation"),
      institution: str("institution"),
      linkedin:    str("linkedin"),
      instagram:   str("instagram"),
    },
  });

  revalidatePath("/admin/instrutores");
  revalidatePath("/instrutores");
  revalidatePath("/sobre");
  revalidatePath("/cursos", "layout"); // revalida todas as páginas de curso
}

export async function deleteInstructor(instructorId: string) {
  await requireAdmin();

  const instructor = await prisma.instructor.findUnique({
    where: { id: instructorId },
    include: { _count: { select: { courses: true } } },
  });
  if (!instructor) throw new Error("Instrutor não encontrado.");
  if (instructor._count.courses > 0) {
    throw new Error("Não é possível remover um instrutor com cursos ativos. Reatribua os cursos primeiro.");
  }

  await prisma.$transaction([
    prisma.instructor.delete({ where: { id: instructorId } }),
    prisma.user.update({
      where: { id: instructor.userId },
      data: { role: "STUDENT" },
    }),
  ]);

  revalidatePath("/admin/instrutores");
}
