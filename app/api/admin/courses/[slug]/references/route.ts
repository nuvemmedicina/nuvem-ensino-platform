import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "INSTRUCTOR")) return null;
  return session;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await prisma.course.findUnique({ where: { slug }, select: { id: true } });
  if (!course) return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });
  const refs = await prisma.courseReference.findMany({
    where: { courseId: course.id },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(refs);
}

const createSchema = z.object({
  title: z.string().min(1),
  fileUrl: z.string().url(),
  fileSize: z.number().int().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { slug } = await params;
  const course = await prisma.course.findUnique({ where: { slug }, select: { id: true } });
  if (!course) return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const count = await prisma.courseReference.count({ where: { courseId: course.id } });
  const ref = await prisma.courseReference.create({
    data: { ...parsed.data, courseId: course.id, order: count },
  });
  return NextResponse.json(ref, { status: 201 });
}
