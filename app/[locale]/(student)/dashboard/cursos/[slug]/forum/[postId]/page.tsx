import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChevronLeft, CheckCircle, Pin } from "lucide-react";
import { ReplyForm } from "./ReplyForm";
import { ReplyCard } from "./ReplyCard";
import { PostActions } from "./PostActions";

type Props = { params: Promise<{ slug: string; postId: string; locale: string }> };

export default async function ForumPostPage({ params }: Props) {
  const { slug, postId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const course = await prisma.course.findFirst({
    where: { slug },
    select: { id: true, title: true },
  });
  if (!course) notFound();

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
    select: { status: true },
  });
  if (!enrollment || (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED")) {
    redirect(`/cursos/${slug}`);
  }

  const post = await prisma.forumPost.findUnique({
    where: { id: postId },
    include: {
      author: { select: { name: true, image: true, role: true } },
      likes: { where: { userId: session.user.id }, select: { id: true } },
      _count: { select: { likes: true } },
      replies: {
        orderBy: [{ isOfficialAnswer: "desc" }, { createdAt: "asc" }],
        include: {
          author: { select: { name: true, image: true, role: true } },
          likes: { where: { userId: session.user.id }, select: { id: true } },
          _count: { select: { likes: true } },
        },
      },
    },
  });
  if (!post || post.courseId !== course.id) notFound();

  const userRole = (session.user as { role?: string }).role ?? "STUDENT";
  const isModerator = userRole === "ADMIN" || userRole === "INSTRUCTOR";
  const isPostAuthor = post.authorId === session.user.id;
  const isAuthorMod = post.author.role === "ADMIN" || post.author.role === "INSTRUCTOR";

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href={`/dashboard/cursos/${slug}/forum`}
        className="inline-flex items-center gap-1.5 font-sans text-sm text-muted hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Voltar à comunidade
      </Link>

      {/* Post principal */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {post.isPinned && (
            <span className="inline-flex items-center gap-1 font-sans text-[10px] font-semibold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              <Pin className="w-3 h-3" /> Fixado
            </span>
          )}
          {post.isAnswered && (
            <span className="inline-flex items-center gap-1 font-sans text-[10px] font-semibold text-green-600 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" /> Respondido
            </span>
          )}
        </div>

        <h1 className="font-serif text-xl font-medium text-foreground mb-4">{post.title}</h1>

        {/* Autor */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
            {post.author.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.author.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-sans text-xs font-semibold text-primary">
                {post.author.name?.[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
          <div>
            <p className="font-sans text-sm font-medium text-foreground flex items-center gap-2">
              {post.author.name ?? "Anônimo"}
              {isAuthorMod && (
                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                  {post.author.role === "ADMIN" ? "Admin" : "Instrutor"}
                </span>
              )}
            </p>
            <p className="font-sans text-xs text-muted">
              {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date(post.createdAt))}
            </p>
          </div>
        </div>

        {/* Conteúdo */}
        <p className="font-sans text-sm text-foreground leading-relaxed whitespace-pre-line">{post.content}</p>

        {/* Ações */}
        <div className="mt-4 pt-4 border-t border-border">
          <PostActions
            courseSlug={slug}
            postId={post.id}
            likeCount={post._count.likes}
            liked={post.likes.length > 0}
            isPinned={post.isPinned}
            isModerator={isModerator}
            isAuthor={isPostAuthor}
          />
        </div>
      </div>

      {/* Respostas */}
      <div className="space-y-4 mb-6">
        {post.replies.length > 0 && (
          <h2 className="font-sans text-sm font-semibold text-muted uppercase tracking-wider">
            {post.replies.length} {post.replies.length === 1 ? "resposta" : "respostas"}
          </h2>
        )}
        {post.replies.map((reply) => (
          <ReplyCard
            key={reply.id}
            courseSlug={slug}
            postId={post.id}
            reply={reply}
            isModerator={isModerator}
            isAuthor={reply.authorId === session.user.id}
          />
        ))}
      </div>

      {/* Formulário de resposta */}
      <ReplyForm courseSlug={slug} postId={post.id} />
    </div>
  );
}
