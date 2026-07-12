import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user.id;
}

const startSchema = z.object({ groupId: z.string() });
const reviewSchema = z.object({
  sessionId: z.string(),
  flashcardId: z.string(),
  rating: z.enum(["EASY", "MEDIUM", "HARD"]),
});
const finishSchema = z.object({ sessionId: z.string() });

export async function POST(req: NextRequest) {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { action } = body as { action?: string };

  if (action === "start") {
    const parsed = startSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const session = await prisma.flashcardStudySession.create({
      data: { userId, groupId: parsed.data.groupId },
    });
    return NextResponse.json({ sessionId: session.id });
  }

  if (action === "review") {
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { sessionId, flashcardId, rating } = parsed.data;

    await prisma.$transaction([
      prisma.flashcardReview.create({ data: { sessionId, flashcardId, rating } }),
      prisma.flashcard.update({ where: { id: flashcardId }, data: { difficulty: rating } }),
      prisma.flashcardStudySession.update({
        where: { id: sessionId },
        data: { cardsReviewed: { increment: 1 } },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === "finish") {
    const parsed = finishSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const session = await prisma.flashcardStudySession.update({
      where: { id: parsed.data.sessionId },
      data: { finishedAt: new Date() },
      include: {
        reviews: { include: { flashcard: { select: { front: true } } } },
      },
    });

    const summary = {
      cardsReviewed: session.cardsReviewed,
      easy: session.reviews.filter((r) => r.rating === "EASY").length,
      medium: session.reviews.filter((r) => r.rating === "MEDIUM").length,
      hard: session.reviews.filter((r) => r.rating === "HARD").length,
    };
    return NextResponse.json({ ok: true, summary });
  }

  return NextResponse.json({ error: "action inválida. Use: start | review | finish" }, { status: 400 });
}
