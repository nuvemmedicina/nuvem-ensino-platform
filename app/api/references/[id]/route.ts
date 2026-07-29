import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getR2DownloadUrl, r2KeyFromPublicUrl } from "@/lib/r2";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const ref = await prisma.courseReference.findUnique({ where: { id } });
  if (!ref) return NextResponse.json({ error: "Material não encontrado." }, { status: 404 });

  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "INSTRUCTOR") {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: ref.courseId } },
    });
    if (!enrollment || (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED")) {
      return NextResponse.json({ error: "Você não está matriculado neste curso." }, { status: 403 });
    }
  }

  const key = r2KeyFromPublicUrl(ref.fileUrl);
  const downloadUrl = await getR2DownloadUrl(key);
  return NextResponse.redirect(downloadUrl);
}
