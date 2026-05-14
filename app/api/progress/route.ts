import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { lessonId, courseId, completed } = await req.json();
  if (!lessonId || !courseId) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "Matrícula não encontrada." }, { status: 404 });
  }

  const progress = await prisma.progress.upsert({
    where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
    create: {
      enrollmentId: enrollment.id,
      lessonId,
      completed: completed ?? true,
      completedAt: completed !== false ? new Date() : null,
    },
    update: {
      completed: completed ?? true,
      completedAt: completed !== false ? new Date() : null,
    },
  });

  // Check if all lessons completed → mark enrollment as COMPLETED
  if (progress.completed) {
    const totalLessons = await prisma.lesson.count({
      where: { module: { courseId } },
    });
    const completedLessons = await prisma.progress.count({
      where: { enrollmentId: enrollment.id, completed: true },
    });
    if (totalLessons > 0 && completedLessons >= totalLessons) {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      await prisma.certificate.upsert({
        where: { enrollmentId: enrollment.id },
        create: { userId: session.user.id, enrollmentId: enrollment.id },
        update: {},
      });
    }
  }

  return NextResponse.json({ ok: true, completed: progress.completed });
}
