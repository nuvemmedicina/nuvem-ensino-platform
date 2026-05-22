import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Users, Video, ChevronRight } from "lucide-react";

export default async function InstructorOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/instrutor");

  const instructor = await prisma.instructor.findUnique({
    where: { userId: session.user.id },
    include: {
      courses: {
        include: {
          _count: { select: { enrollments: true } },
          liveSessions: {
            where: { startAt: { gt: new Date() } },
            orderBy: { startAt: "asc" },
            take: 5,
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!instructor) {
    // Auto-create a minimal instructor profile so the user can proceed
    function slugify(name: string) {
      return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }
    const baseSlug = slugify(session.user.name ?? session.user.email?.split("@")[0] ?? "instrutor");
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.instructor.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }
    const created = await prisma.instructor.create({
      data: { userId: session.user.id, slug },
    });
    // Ensure role is set to INSTRUCTOR
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: "INSTRUCTOR" },
    });
    redirect(`/instrutor`);
    // satisfy type-checker — redirect() throws, so this is unreachable
    return null as never;
  }

  const totalCourses = instructor.courses.length;
  const totalEnrollments = instructor.courses.reduce(
    (sum, c) => sum + c._count.enrollments,
    0
  );
  const upcomingSessions = instructor.courses
    .flatMap((c) => c.liveSessions.map((s) => ({ ...s, courseTitle: c.title })))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, 5);

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

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(d));

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-light text-foreground">
          Bem-vindo, {session.user?.name?.split(" ")[0]}
        </h1>
        <p className="font-sans text-sm text-muted mt-1">
          Painel do instrutor — gerencie seus cursos e aulas ao vivo
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <span className="font-sans text-xs font-semibold text-muted uppercase tracking-wider">
              Cursos
            </span>
          </div>
          <p className="font-serif text-3xl font-medium text-foreground">{totalCourses}</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-teal-500" />
            </div>
            <span className="font-sans text-xs font-semibold text-muted uppercase tracking-wider">
              Matrículas
            </span>
          </div>
          <p className="font-serif text-3xl font-medium text-foreground">{totalEnrollments}</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Video className="w-4 h-4 text-violet-500" />
            </div>
            <span className="font-sans text-xs font-semibold text-muted uppercase tracking-wider">
              Próximas Aulas
            </span>
          </div>
          <p className="font-serif text-3xl font-medium text-foreground">{upcomingSessions.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Courses list */}
        <div className="lg:col-span-2">
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-sans text-sm font-semibold text-foreground">Meus Cursos</h2>
              <Link
                href="/instrutor/cursos"
                className="font-sans text-xs text-primary hover:underline"
              >
                Ver todos
              </Link>
            </div>
            {instructor.courses.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="font-sans text-sm text-muted">
                  Nenhum curso atribuído ainda.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {instructor.courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/instrutor/cursos/${course.slug}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-background/50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`font-sans text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            statusColors[course.status] ?? statusColors.DRAFT
                          }`}
                        >
                          {statusLabels[course.status] ?? course.status}
                        </span>
                      </div>
                      <p className="font-sans text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {course.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      <div className="text-right">
                        <p className="font-sans text-[10px] text-muted">Matrículas</p>
                        <p className="font-sans text-sm font-semibold text-foreground">
                          {course._count.enrollments}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming sessions */}
        <div>
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-sans text-sm font-semibold text-foreground">Próximas Aulas</h2>
              <Link
                href="/instrutor/aulas-ao-vivo"
                className="font-sans text-xs text-primary hover:underline"
              >
                Gerenciar
              </Link>
            </div>
            {upcomingSessions.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="font-sans text-sm text-muted">
                  Nenhuma aula programada.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {upcomingSessions.map((s) => (
                  <div key={s.id} className="px-4 py-3">
                    <p className="font-sans text-[10px] text-primary font-semibold uppercase tracking-wide mb-0.5 truncate">
                      {s.courseTitle}
                    </p>
                    <p className="font-sans text-xs font-medium text-foreground truncate">{s.title}</p>
                    <p className="font-sans text-[10px] text-muted mt-0.5">{fmt(s.startAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
