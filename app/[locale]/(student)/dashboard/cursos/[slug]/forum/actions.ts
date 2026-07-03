"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getSessionOrThrow() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");
  return session;
}

function isModeratorRole(role: string) {
  return role === "ADMIN" || role === "INSTRUCTOR";
}

export async function createForumPost(courseSlug: string, courseId: string, title: string, content: string) {
  const session = await getSessionOrThrow();
  if (!title.trim() || !content.trim()) throw new Error("Título e conteúdo são obrigatórios.");

  await prisma.forumPost.create({
    data: { courseId, authorId: session.user.id, title: title.trim(), content: content.trim() },
  });
  revalidatePath(`/dashboard/cursos/${courseSlug}/forum`);
}

export async function createForumReply(courseSlug: string, postId: string, content: string) {
  const session = await getSessionOrThrow();
  if (!content.trim()) throw new Error("Resposta não pode ser vazia.");

  await prisma.forumReply.create({
    data: { postId, authorId: session.user.id, content: content.trim() },
  });
  revalidatePath(`/dashboard/cursos/${courseSlug}/forum/${postId}`);
}

export async function togglePostLike(courseSlug: string, postId: string) {
  const session = await getSessionOrThrow();
  const existing = await prisma.forumLike.findUnique({
    where: { userId_postId: { userId: session.user.id, postId } },
  });
  if (existing) {
    await prisma.forumLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.forumLike.create({ data: { userId: session.user.id, postId } });
  }
  revalidatePath(`/dashboard/cursos/${courseSlug}/forum`);
  revalidatePath(`/dashboard/cursos/${courseSlug}/forum/${postId}`);
}

export async function toggleReplyLike(courseSlug: string, postId: string, replyId: string) {
  const session = await getSessionOrThrow();
  const existing = await prisma.forumLike.findUnique({
    where: { userId_replyId: { userId: session.user.id, replyId } },
  });
  if (existing) {
    await prisma.forumLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.forumLike.create({ data: { userId: session.user.id, replyId } });
  }
  revalidatePath(`/dashboard/cursos/${courseSlug}/forum/${postId}`);
}

export async function togglePinPost(courseSlug: string, postId: string) {
  const session = await getSessionOrThrow();
  const role = (session.user as { role?: string }).role ?? "STUDENT";
  if (!isModeratorRole(role)) throw new Error("Sem permissão.");

  const post = await prisma.forumPost.findUnique({ where: { id: postId }, select: { isPinned: true } });
  if (!post) throw new Error("Tópico não encontrado.");

  await prisma.forumPost.update({ where: { id: postId }, data: { isPinned: !post.isPinned } });
  revalidatePath(`/dashboard/cursos/${courseSlug}/forum`);
}

export async function toggleOfficialAnswer(courseSlug: string, postId: string, replyId: string) {
  const session = await getSessionOrThrow();
  const role = (session.user as { role?: string }).role ?? "STUDENT";
  if (!isModeratorRole(role)) throw new Error("Sem permissão.");

  const reply = await prisma.forumReply.findUnique({ where: { id: replyId }, select: { isOfficialAnswer: true } });
  if (!reply) throw new Error("Resposta não encontrada.");

  await prisma.$transaction([
    prisma.forumReply.update({ where: { id: replyId }, data: { isOfficialAnswer: !reply.isOfficialAnswer } }),
    prisma.forumPost.update({ where: { id: postId }, data: { isAnswered: !reply.isOfficialAnswer } }),
  ]);
  revalidatePath(`/dashboard/cursos/${courseSlug}/forum/${postId}`);
}

export async function deleteForumPost(courseSlug: string, postId: string) {
  const session = await getSessionOrThrow();
  const role = (session.user as { role?: string }).role ?? "STUDENT";
  const post = await prisma.forumPost.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post) throw new Error("Tópico não encontrado.");
  if (post.authorId !== session.user.id && !isModeratorRole(role)) throw new Error("Sem permissão.");

  await prisma.forumPost.delete({ where: { id: postId } });
  revalidatePath(`/dashboard/cursos/${courseSlug}/forum`);
}

export async function deleteForumReply(courseSlug: string, postId: string, replyId: string) {
  const session = await getSessionOrThrow();
  const role = (session.user as { role?: string }).role ?? "STUDENT";
  const reply = await prisma.forumReply.findUnique({ where: { id: replyId }, select: { authorId: true } });
  if (!reply) throw new Error("Resposta não encontrada.");
  if (reply.authorId !== session.user.id && !isModeratorRole(role)) throw new Error("Sem permissão.");

  await prisma.forumReply.delete({ where: { id: replyId } });
  revalidatePath(`/dashboard/cursos/${courseSlug}/forum/${postId}`);
}
