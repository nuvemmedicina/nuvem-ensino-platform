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

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  courseId: z.string().optional().nullable(),
  topicId: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional(),
  // Card sem id é novo. Card existente que não vier na lista é removido.
  cards: z
    .array(
      z.object({
        id: z.string().optional(),
        front: z.string().min(1),
        back: z.string().min(1),
      }),
    )
    .optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await prisma.flashcardGroup.findUnique({
    where: { id },
    include: { cards: { orderBy: { order: "asc" } }, designConfig: true },
  });
  if (!group) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(group);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireAdmin(req);
  if (deny) return deny;
  const { id } = await params;

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { cards, ...dadosDoGrupo } = parsed.data;

  // O curso segue o tópico, para os dois nunca discordarem.
  if (dadosDoGrupo.topicId) {
    const topico = await prisma.topic.findUnique({
      where: { id: dadosDoGrupo.topicId },
      select: { module: { select: { courseId: true } } },
    });
    if (topico) dadosDoGrupo.courseId = topico.module.courseId;
  }

  if (cards) {
    const { sincronizarCards } = await import("@/lib/flashcards");
    await sincronizarCards(id, cards);
  }

  const group = await prisma.flashcardGroup.update({ where: { id }, data: dadosDoGrupo });
  return NextResponse.json(group);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireAdmin(_req);
  if (deny) return deny;
  const { id } = await params;
  await prisma.flashcardGroup.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
