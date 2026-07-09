"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

async function reativarMatricula(formData: FormData) {
  "use server";
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") redirect("/admin");

  const email      = (formData.get("email") as string).trim().toLowerCase();
  const courseSlug = (formData.get("courseSlug") as string).trim();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Usuário não encontrado: " + email);

  const course = await prisma.course.findUnique({ where: { slug: courseSlug } });
  if (!course) throw new Error("Curso não encontrado: " + courseSlug);

  const existing = await prisma.enrollment.findFirst({
    where: { userId: user.id, courseId: course.id },
  });

  if (existing) {
    await prisma.enrollment.update({ where: { id: existing.id }, data: { status: "ACTIVE" } });
  } else {
    await prisma.enrollment.create({
      data: { id: randomUUID(), userId: user.id, courseId: course.id, status: "ACTIVE" },
    });
  }

  revalidatePath("/admin/matriculas");
  redirect("/admin/matriculas?reativada=1");
}

export default async function ReativarMatriculaPage() {
  return (
    <div className="max-w-md">
      <h1 className="font-serif text-2xl font-light text-foreground mb-6">Reativar Matrícula</h1>
      <form action={reativarMatricula} className="space-y-4">
        <div>
          <label className="font-sans text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
            E-mail do aluno
          </label>
          <input
            name="email"
            type="email"
            required
            defaultValue="anapgs.mkt@gmail.com"
            className="w-full border border-border rounded-lg px-3 py-2 font-sans text-sm text-foreground bg-background"
          />
        </div>
        <div>
          <label className="font-sans text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
            Slug do curso
          </label>
          <input
            name="courseSlug"
            type="text"
            required
            defaultValue="dici-neurogastroenterologia-2026"
            className="w-full border border-border rounded-lg px-3 py-2 font-sans text-sm text-foreground bg-background"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-white font-sans text-sm font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Reativar / Criar Matrícula
        </button>
      </form>
    </div>
  );
}
