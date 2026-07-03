import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MessageSquare, CheckCircle, Pin, Heart } from "lucide-react";

export default async function ComunidadePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  // Busca cursos em que o aluno está ativo
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id, status: { in: ["ACTIVE", "COMPLETED"] } },
    select: { courseId: true, course: { select: { title: true, slug: true } } },
  });
  const courseIds = enrollments.map((e) => e.courseId);

  const posts = await prisma.forumPost.findMany({
    where: { courseId: { in: courseIds } },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 50,
    include: {
      course: { select: { title: true, slug: true } },
      author: { select: { name: true, image: true, role: true } },
      _count: { select: { replies: true, likes: true } },
      likes: { where: { userId: session.user.id }, select: { id: true } },
    },
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-medium text-foreground">Comunidade</h1>
        <p className="font-sans text-sm text-muted mt-1">
          Discussões dos seus cursos — tire dúvidas e troque experiências com outros médicos.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border rounded-2xl">
          <MessageSquare className="w-10 h-10 text-muted/30 mx-auto mb-3" />
          <p className="font-serif text-lg text-foreground/40">Nenhuma discussão ainda</p>
          <p className="font-sans text-sm text-muted mt-1 mb-6">
            Acesse o fórum de um curso para iniciar a primeira discussão.
          </p>
          {enrollments.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {enrollments.map((e) => (
                <Link
                  key={e.courseId}
                  href={`/dashboard/cursos/${e.course.slug}/forum`}
                  className="font-sans text-sm font-semibold px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {e.course.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const isAuthorMod = post.author.role === "ADMIN" || post.author.role === "INSTRUCTOR";
            return (
              <Link
                key={post.id}
                href={`/dashboard/cursos/${post.course.slug}/forum/${post.id}`}
                className="block bg-surface border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-3">
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

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-sans text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {post.course.title}
                      </span>
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

                    <h2 className="font-sans text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h2>

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="font-sans text-xs text-muted">
                        {post.author.name ?? "Anônimo"}
                        {isAuthorMod && (
                          <span className="ml-1.5 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                            {post.author.role === "ADMIN" ? "Admin" : "Instrutor"}
                          </span>
                        )}
                      </span>
                      <span className="text-border">·</span>
                      <span className="font-sans text-xs text-muted">
                        {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(post.createdAt))}
                      </span>
                      <span className="text-border">·</span>
                      <span className="inline-flex items-center gap-1 font-sans text-xs text-muted">
                        <MessageSquare className="w-3.5 h-3.5" /> {post._count.replies}
                      </span>
                      <span className="inline-flex items-center gap-1 font-sans text-xs text-muted">
                        <Heart className={`w-3.5 h-3.5 ${post.likes.length > 0 ? "fill-red-400 text-red-400" : ""}`} />
                        {post._count.likes}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
