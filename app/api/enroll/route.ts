import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { courseSlug } = await req.json();
  if (!courseSlug) return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });

  try {
    const enrollment = await prisma.$transaction(async (tx) => {
      const course = await tx.course.findFirst({
        where: { slug: courseSlug },
        select: { id: true, totalSeats: true, reservedSeats: true },
      });
      if (!course) throw Object.assign(new Error("Curso não encontrado."), { status: 404 });

      // Check seat availability for non-online courses
      if (course.totalSeats !== null) {
        const available = course.totalSeats - course.reservedSeats;
        if (available <= 0) {
          throw Object.assign(new Error("Não há vagas disponíveis para este curso."), { status: 409 });
        }
      }

      // Check if already enrolled
      const existing = await tx.enrollment.findUnique({
        where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
        select: { id: true, status: true },
      });

      if (existing?.status === "ACTIVE") {
        return existing;
      }

      if (existing) {
        // Reactivate cancelled enrollment — only increment seats if it was cancelled/refunded
        await tx.course.update({
          where: { id: course.id },
          data: { reservedSeats: { increment: 1 } },
        });
        return tx.enrollment.update({
          where: { id: existing.id },
          data: { status: "ACTIVE" },
        });
      }

      // New enrollment
      if (course.totalSeats !== null) {
        await tx.course.update({
          where: { id: course.id },
          data: { reservedSeats: { increment: 1 } },
        });
      }

      return tx.enrollment.create({
        data: { userId: session.user.id, courseId: course.id, status: "ACTIVE" },
      });
    });

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
