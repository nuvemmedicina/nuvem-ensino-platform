import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Users, Video, PlayCircle, Settings, Calendar } from "lucide-react";

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
    select: { id: true, slug: true },
  });

  if (!instructor) {
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
    await prisma.instructor.create({ data: { userId: session.user.id, slug } });
    await prisma.user.update({ where: { id: session.user.id }, data: { role: "INSTRUCTOR" } });
    redirect(`/instrutor`);
    return null as never;
  }

  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { instructorId: instructor.id },
        { modules: { some: { instructors: { some: { instructorId: instructor.id } } } } },
      ],
    },
    include: {
      _count: { select: { enrollments: true } },
      liveSessions: {
        where: { startAt: { gt: new Date() } },
        orderBy: { startAt: "asc" },
        take: 3,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalEnrollments = courses.reduce((sum, c) => sum + c._count.enrollments, 0);
  const upcomingSessions = courses
    .flatMap((c) => c.liveSessions.map((s) => ({ ...s, courseTitle: c.title, courseSlug: c.slug })))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, 5);

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(d));

  const statusLabels: Record<string, string> = {
    PUBLISHED: "Publicado",
    DRAFT: "Rascunho",
    ARCHIVED: "Arquivado",
  };

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-light text-foreground">
          Bem-vindo, {session.user?.name?.split(" ")[0]}
        </h1>
        <p className="font-sans text-sm text-muted mt-1">
          Painel do instrutor — gerencie seus cursos e aulas ao vivo
        </p>
      </div>

      {/* KPI chips */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { icon: BookOpen, label: "Cursos",          value: courses.length,           color: "text-primary",     bg: "bg-primary/8 border-primary/20" },
          { icon: Users,    label: "Matrículas",      value: totalEnrollments,          color: "text-teal-600",    bg: "bg-teal-500/8 border-teal-500/20" },
          { icon: Video,    label: "Próximas Aulas",  value: upcomingSessions.length,   color: "text-violet-600",  bg: "bg-violet-500/8 border-violet-500/20" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={`flex items-center gap-4 rounded-2xl border px-5 py-4 ${bg}`}>
            <Icon className={`w-5 h-5 shrink-0 ${color}`} />
            <div>
              <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted">{label}</p>
              <p className={`font-serif text-2xl font-medium ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Meus Cursos — cards Netflix */}
      {courses.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-foreground/70">Meus Cursos</p>
            <Link href="/instrutor/cursos" className="font-sans text-xs text-primary hover:underline">Ver todos</Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {courses.map((course) => (
              <div key={course.id} className="group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/15" style={{ background: "var(--color-surface)" }}>
                {/* Poster */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#0e4f6b] to-[#1a8fa8]" style={{ paddingBottom: "140%" }}>
                  {course.thumbnailUrl ? (
                    <Image
                      src={course.thumbnailUrl}
                      alt={course.title}
                      fill
                      className="absolute inset-0 object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 33vw, 20vw"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  {/* Status badge */}
                  <span className={`absolute top-3 left-3 font-sans text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                    course.status === "PUBLISHED" ? "bg-green-500 text-white" :
                    course.status === "DRAFT"     ? "bg-amber-400 text-amber-900" :
                                                    "bg-white/20 text-white"
                  }`}>
                    {statusLabels[course.status] ?? course.status}
                  </span>

                  {/* Info sobreposta */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="font-sans text-[9px] font-bold uppercase tracking-widest text-white/50 mb-1">
                      {course._count.enrollments} alunos
                    </p>
                    <p className="font-sans text-sm font-bold text-white leading-snug line-clamp-2">
                      {course.title}
                    </p>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex flex-col gap-1.5 p-2.5">
                  <Link
                    href={`/dashboard/cursos/${course.slug}`}
                    target="_blank"
                    className="w-full flex items-center justify-center gap-1.5 font-sans text-[11px] font-bold px-3 py-2 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    Assistir
                  </Link>
                  <Link
                    href={`/instrutor/cursos/${course.slug}`}
                    className="w-full flex items-center justify-center gap-1.5 font-sans text-[11px] font-semibold px-3 py-2 rounded-xl border border-border text-muted hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    <Settings className="w-3 h-3" />
                    Gerenciar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {courses.length === 0 && (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center mb-10">
          <p className="font-sans text-sm text-muted">Nenhum curso atribuído ainda.</p>
        </div>
      )}

      {/* Próximas aulas ao vivo */}
      {upcomingSessions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-foreground/70">Próximas Aulas ao Vivo</p>
            <Link href="/instrutor/aulas-ao-vivo" className="font-sans text-xs text-primary hover:underline">Gerenciar</Link>
          </div>
          <div className="flex flex-col gap-2">
            {upcomingSessions.map((s) => (
              <div key={s.id} className="flex items-center gap-4 bg-surface border border-border rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-primary/70 truncate">{s.courseTitle}</p>
                  <p className="font-sans text-sm font-medium text-foreground truncate">{s.title}</p>
                </div>
                <p className="font-sans text-xs text-muted shrink-0">{fmt(s.startAt)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
