import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const COMMENT_SELECT = {
  id: true,
  content: true,
  parentId: true,
  createdAt: true,
  user: { select: { id: true, name: true, image: true, role: true } },
  replies: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      content: true,
      parentId: true,
      createdAt: true,
      user: { select: { id: true, name: true, image: true, role: true } },
    },
  },
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const lessonId = req.nextUrl.searchParams.get("lessonId");
  if (!lessonId) return NextResponse.json({ error: "lessonId obrigatório." }, { status: 400 });

  // Verify enrollment — user must be enrolled in the course containing this lesson
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  });
  if (!lesson) return NextResponse.json({ error: "Aula não encontrada." }, { status: 404 });

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: lesson.module.courseId } },
  });
  const role = (session.user as { role?: string }).role;
  if (!enrollment && role !== "ADMIN" && role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const comments = await prisma.lessonComment.findMany({
    where: { lessonId, parentId: null },
    orderBy: { createdAt: "asc" },
    select: COMMENT_SELECT,
  });

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { lessonId, content, parentId } = await req.json();
  if (!lessonId || !content?.trim()) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  });
  if (!lesson) return NextResponse.json({ error: "Aula não encontrada." }, { status: 404 });

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: lesson.module.courseId } },
  });
  const role = (session.user as { role?: string }).role;
  if (!enrollment && role !== "ADMIN" && role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const comment = await prisma.lessonComment.create({
    data: {
      lessonId,
      userId: session.user.id,
      content: content.trim(),
      parentId: parentId ?? null,
    },
    select: {
      id: true,
      content: true,
      parentId: true,
      createdAt: true,
      user: { select: { id: true, name: true, image: true, role: true } },
      replies: { select: { id: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório." }, { status: 400 });

  const comment = await prisma.lessonComment.findUnique({ where: { id }, select: { userId: true } });
  if (!comment) return NextResponse.json({ error: "Comentário não encontrado." }, { status: 404 });

  const role = (session.user as { role?: string }).role;
  if (comment.userId !== session.user.id && role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  await prisma.lessonComment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
