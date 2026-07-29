"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Erros esperados são retornados (não lançados): em produção o Next.js
// mascara mensagens de erros lançados em Server Actions.
export type ActionResult = { error: string | null };

async function requireAdmin(): Promise<string | null> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") return "Não autorizado.";
  return null;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function readableError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  return `Erro inesperado: ${msg}`;
}

export async function createInstructor(formData: FormData): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const email    = ((formData.get("email") as string) || "").trim().toLowerCase();
  const title    = (formData.get("title") as string) || null;
  const crm      = (formData.get("crm") as string) || null;
  const rqe      = (formData.get("rqe") as string) || null;
  const photoUrl = (formData.get("photoUrl") as string) || null;

  if (!email) return { error: "Informe o e-mail da conta." };

  try {
    // Busca o usuário pelo e-mail
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, role: true },
    });
    if (!user) {
      return {
        error: `Nenhuma conta encontrada com o e-mail "${email}". A pessoa precisa primeiro criar a conta na plataforma (Entrar → Criar conta, ou login com Google) — depois cadastre-a aqui como instrutor.`,
      };
    }

    // Verifica se já tem perfil de instrutor
    const existing = await prisma.instructor.findUnique({ where: { userId: user.id } });
    if (existing) return { error: "Este usuário já tem um perfil de instrutor." };

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
  } catch (e) {
    console.error("createInstructor:", e);
    return { error: readableError(e) };
  }

  revalidatePath("/admin/instrutores");
  return { error: null };
}

export async function updateInstructor(instructorId: string, formData: FormData): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const str = (key: string) => (formData.get(key) as string) || null;

  try {
    const instructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
      select: { userId: true, user: { select: { email: true } } },
    });
    if (!instructor) return { error: "Instrutor não encontrado." };

    const newEmail = (formData.get("email") as string)?.trim();
    if (newEmail && newEmail !== instructor.user.email) {
      const conflict = await prisma.user.findUnique({ where: { email: newEmail } });
      if (conflict) return { error: `Já existe uma conta cadastrada com o e-mail "${newEmail}".` };
    }

    await prisma.$transaction([
      prisma.instructor.update({
        where: { id: instructorId },
        data: {
          title:       str("title"),
          crm:         str("crm"),
          rqe:         str("rqe"),
          photoUrl:    str("photoUrl"),
          bio:         str("bio"),
          formation:   str("formation"),
          institution: str("institution"),
          linkedin:     str("linkedin"),
          instagram:    str("instagram"),
          displayOrder: formData.get("displayOrder") ? parseInt(formData.get("displayOrder") as string) : 99,
        },
      }),
      ...(newEmail && newEmail !== instructor.user.email
        ? [prisma.user.update({ where: { id: instructor.userId }, data: { email: newEmail } })]
        : []),
    ]);
  } catch (e) {
    console.error("updateInstructor:", e);
    return { error: readableError(e) };
  }

  revalidatePath("/admin/instrutores");
  revalidatePath("/instrutores");
  revalidatePath("/sobre");
  revalidatePath("/cursos", "layout"); // revalida todas as páginas de curso
  return { error: null };
}

export async function deleteInstructor(instructorId: string): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  try {
    const instructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
      include: { _count: { select: { courses: true } } },
    });
    if (!instructor) return { error: "Instrutor não encontrado." };
    if (instructor._count.courses > 0) {
      return { error: "Não é possível remover um instrutor com cursos ativos. Reatribua os cursos primeiro." };
    }

    await prisma.$transaction([
      prisma.instructor.delete({ where: { id: instructorId } }),
      prisma.user.update({
        where: { id: instructor.userId },
        data: { role: "STUDENT" },
      }),
    ]);
  } catch (e) {
    console.error("deleteInstructor:", e);
    return { error: readableError(e) };
  }

  revalidatePath("/admin/instrutores");
  return { error: null };
}
