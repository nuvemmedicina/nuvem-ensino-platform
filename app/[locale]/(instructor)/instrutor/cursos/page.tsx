import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function InstructorCursosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/instrutor/cursos");

  const instructor = await prisma.instructor.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!instructor) redirect("/dashboard");

  const statusColors: Record<string, string> = {
    PUBLISHED: "text-green-600 bg-green-500/10 border-green-500/20",
    DRAFT: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    ARCHIVED: "text-muted bg-border/50 border-border",
  };
  const statusLabels: Record<string, string> = {
    PUBLISHED: "Publicado",
    DRAFT: "Rascunho",
    ARCHIVED: "Arquivado",
  };

  const courses = await prisma.course.findMany({
    where: { instructorId: instructor.id },
    include: {
      modules: { include: { lessons: { select: { id: true } } } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-light text-foreground">Meus Cursos</h1>
          <p className="font-sans text-sm text-muted mt-1">
            {courses.length} {courses.length === 1 ? "curso atribuído" : "cursos atribuídos"}
          </p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center">
          <p className="font-sans text-sm text-muted">
            Nenhum curso atribuído a você ainda. Entre em contato com o administrador.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {courses.map((course) => {
            const totalLessons = course.modules.reduce(
              (s, m) => s + m.lessons.length,
              0
            );
            const statusColor = statusColors[course.status] ?? statusColors.DRAFT;
            const statusLabel = statusLabels[course.status] ?? course.status;

            return (
              <Link
                key={course.id}
                href={`/instrutor/cursos/${course.slug}`}
                className="flex items-center justify-between gap-4 px-6 py-4 bg-surface border border-border rounded-2xl hover:border-primary/40 hover:shadow-sm transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span
                      className={`font-sans text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <h2 className="font-serif text-base font-medium text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
                    {course.title}
                  </h2>
                </div>

                <div className="flex items-center gap-6 shrink-0 text-right">
                  <div className="hidden sm:block">
                    <p className="font-sans text-xs text-muted">Aulas</p>
                    <p className="font-sans text-sm font-semibold text-foreground">
                      {totalLessons}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="font-sans text-xs text-muted">Matrículas</p>
                    <p className="font-sans text-sm font-semibold text-foreground">
                      {course._count.enrollments}
                    </p>
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
