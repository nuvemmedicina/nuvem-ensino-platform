import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { email, courseSlug } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  const course = await prisma.course.findUnique({ where: { slug: courseSlug } });
  if (!course) return NextResponse.json({ error: "Curso não encontrado." }, { status: 404 });

  const existing = await prisma.enrollment.findFirst({
    where: { userId: user.id, courseId: course.id },
  });

  if (existing) {
    await prisma.enrollment.update({
      where: { id: existing.id },
      data: { status: "ACTIVE" },
    });
    return NextResponse.json({ ok: true, action: "reativada", enrollmentId: existing.id });
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      id: crypto.randomUUID(),
      userId: user.id,
      courseId: course.id,
      status: "ACTIVE",
    },
  });
  return NextResponse.json({ ok: true, action: "criada", enrollmentId: enrollment.id });
}
