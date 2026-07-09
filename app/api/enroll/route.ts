import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEnrollmentConfirmation } from "@/lib/email";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { courseSlug } = await req.json();
  if (!courseSlug) return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });

  try {
    const { enrollment, course, isNew } = await prisma.$transaction(async (tx) => {
      const c = await tx.course.findFirst({
        where: { slug: courseSlug, status: "PUBLISHED" },
        select: { id: true, title: true, slug: true, totalSeats: true, reservedSeats: true },
      });
      if (!c) throw Object.assign(new Error("Curso não encontrado."), { status: 404 });

      // Check seat availability for non-online courses
      if (c.totalSeats !== null) {
        const available = c.totalSeats - c.reservedSeats;
        if (available <= 0) {
          throw Object.assign(new Error("Não há vagas disponíveis para este curso."), { status: 409 });
        }
      }

      // Check if already enrolled
      const existing = await tx.enrollment.findUnique({
        where: { userId_courseId: { userId: session.user.id, courseId: c.id } },
        select: { id: true, status: true },
      });

      if (existing?.status === "ACTIVE") {
        return { enrollment: existing, course: c, isNew: false };
      }

      if (existing) {
        // Reactivate cancelled enrollment — only increment seats if it was cancelled/refunded
        await tx.course.update({
          where: { id: c.id },
          data: { reservedSeats: { increment: 1 } },
        });
        const updated = await tx.enrollment.update({
          where: { id: existing.id },
          data: { status: "ACTIVE" },
        });
        return { enrollment: updated, course: c, isNew: true };
      }

      // New enrollment
      if (c.totalSeats !== null) {
        await tx.course.update({
          where: { id: c.id },
          data: { reservedSeats: { increment: 1 } },
        });
      }

      const created = await tx.enrollment.create({
        data: { userId: session.user.id, courseId: c.id, status: "ACTIVE" },
      });
      return { enrollment: created, course: c, isNew: true };
    });

    // Send confirmation email for new enrollments (fire-and-forget)
    if (isNew) {
      sendEnrollmentConfirmation({
        to: session.user.email ?? "",
        userName: session.user.name ?? "Aluno",
        courseName: course.title,
        courseSlug: course.slug,
      }).catch((err) => console.error("Free enrollment email error:", err));
    }

    return NextResponse.json({
      ok: true,
      enrollmentId: enrollment.id,
      redirectUrl: `/dashboard/cursos/${courseSlug}?sucesso=1`,
    });
  } catch (err: unknown) {
    const e = err as Error & { status?: number };
    const status = e.status ?? 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}
