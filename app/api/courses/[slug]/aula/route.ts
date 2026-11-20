import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Endereço da aula exclusiva da página pública do curso (Course.previewUrl),
 * entregue só a quem tem matrícula ativa ou concluída. Usado por
 * AulaMatriculados, para que a página do curso possa ficar em cache. Quem não
 * pode ver recebe { url: null } com status 200, para não sujar o console dos
 * visitantes da página.
 */
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ url: null });

  const { slug } = await params;
  const course = await prisma.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, previewUrl: true },
  });
  if (!course?.previewUrl) return NextResponse.json({ url: null });

  const matricula = await prisma.enrollment.findFirst({
    where: {
      userId: session.user.id,
      courseId: course.id,
      status: { in: ["ACTIVE", "COMPLETED"] },
    },
    select: { id: true },
  });
  if (!matricula) return NextResponse.json({ url: null });

  return NextResponse.json(
    { url: course.previewUrl },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
