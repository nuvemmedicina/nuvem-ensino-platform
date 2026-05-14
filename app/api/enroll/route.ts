import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { courseSlug } = await req.json();
  if (!courseSlug) return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });

  const course = await prisma.course.findFirst({ where: { slug: courseSlug } });
  if (!course) return NextResponse.json({ error: "Curso não encontrado." }, { status: 404 });

  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
    create: { userId: session.user.id, courseId: course.id, status: "ACTIVE" },
    update: { status: "ACTIVE" },
  });

  return NextResponse.json({
    ok: true,
    enrollmentId: enrollment.id,
    redirectUrl: `/dashboard/cursos/${courseSlug}?sucesso=1`,
  });
}
