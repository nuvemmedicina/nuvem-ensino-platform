"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function saveNote(lessonId: string, content: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const existing = await prisma.note.findFirst({
    where: { userId: session.user.id, lessonId },
    select: { id: true },
  });

  if (existing) {
    await prisma.note.update({
      where: { id: existing.id },
      data: { content },
    });
  } else {
    await prisma.note.create({
      data: { userId: session.user.id, lessonId, content },
    });
  }
}
