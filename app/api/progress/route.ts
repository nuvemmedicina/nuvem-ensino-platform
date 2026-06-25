import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { captureServerEvent } from "@/lib/posthog";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { lessonId, courseId, completed } = await req.json();
  if (!lessonId || !courseId) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    include: { course: { select: { title: true, slug: true } } },
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

  // Evento: aula concluída
  if (progress.completed) {
    await captureServerEvent(session.user.id, "lesson_completed", {
      course_id: courseId,
      course_title: enrollment.course.title,
      course_slug: enrollment.course.slug,
      lesson_id: lessonId,
    });

    // Verifica se todas as aulas foram concluídas
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

      const cert = await prisma.certificate.upsert({
        where: { enrollmentId: enrollment.id },
        create: { userId: session.user.id, enrollmentId: enrollment.id },
        update: {},
      });

      // Evento: curso concluído + certificado emitido
      await captureServerEvent(session.user.id, "course_completed", {
        course_id: courseId,
        course_title: enrollment.course.title,
        course_slug: enrollment.course.slug,
        certificate_id: cert.id,
        total_lessons: totalLessons,
      });

      return NextResponse.json({ ok: true, completed: true, courseCompleted: true, certificateId: cert.id });
    }
  }

  return NextResponse.json({ ok: true, completed: progress.completed });
}
