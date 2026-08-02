import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "EDITOR")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  return null;
}

const groupSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  courseId: z.string().optional().nullable(),
  topicId: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional(),
  cards: z.array(z.object({ front: z.string().min(1), back: z.string().min(1) })).optional(),
});

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const groups = await prisma.flashcardGroup.findMany({
    include: { _count: { select: { cards: true } }, course: { select: { title: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body = await req.json();
  const parsed = groupSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { title, description, courseId, topicId, imageUrl, tags, cards } = parsed.data;

  // O curso vem do tópico, para os dois nunca discordarem. A listagem do aluno
  // se organiza pelo tópico e o controle de acesso continua olhando o curso.
  const cursoDoTopico = topicId
    ? (await prisma.topic.findUnique({
        where: { id: topicId },
        select: { module: { select: { courseId: true } } },
      }))?.module.courseId ?? null
    : null;

  const group = await prisma.flashcardGroup.create({
    data: {
      title,
      description,
      courseId: cursoDoTopico ?? courseId ?? null,
      topicId: topicId ?? null,
      imageUrl: imageUrl ?? null,
      tags: tags ?? [],
      cards: cards
        ? { create: cards.map((c, i) => ({ front: c.front, back: c.back, order: i })) }
        : undefined,
    },
    include: { _count: { select: { cards: true } } },
  });

  return NextResponse.json(group, { status: 201 });
}
