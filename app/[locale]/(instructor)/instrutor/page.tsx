import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Users, Radio, PlayCircle, Settings, Calendar, Plus, ChevronRight, MapPin } from "lucide-react";

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
      return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }
    const baseSlug = slugify(session.user.name ?? session.user.email?.split("@")[0] ?? "instrutor");
    let slug = baseSlug; let counter = 1;
    while (await prisma.instructor.findUnique({ where: { slug } })) slug = `${baseSlug}-${counter++}`;
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
    .flatMap((c) => c.liveSessions.map((s) => ({ ...s, courseTitle: c.title, courseSlug: c.slug, courseThumbnail: c.thumbnailUrl })))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, 6);

  const fmtDate = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" });
  const fmtTime = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

  const statusLabels: Record<string, string> = { PUBLISHED: "Publicado", DRAFT: "Rascunho", ARCHIVED: "Arquivado" };

  return (
    <div className="max-w-5xl space-y-10">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-light text-foreground">
            Bem-vindo, {session.user?.name?.split(" ")[0]}
          </h1>
          <p className="font-sans text-sm text-muted mt-1">Painel do instrutor</p>
        </div>
        <Link
          href="/instrutor/aulas-ao-vivo"
          className="flex items-center gap-2 font-sans text-sm font-bold px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors shadow-md shadow-primary/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nova aula ao vivo
        </Link>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: BookOpen, label: "Cursos",         value: courses.length,          color: "text-primary",    ring: "ring-primary/20",   bg: "bg-primary/5" },
          { icon: Users,    label: "Alunos",          value: totalEnrollments,         color: "text-teal-600",   ring: "ring-teal-500/20",  bg: "bg-teal-500/5" },
          { icon: Radio,    label: "Próximas Lives",  value: upcomingSessions.length,  color: "text-violet-600", ring: "ring-violet-500/20", bg: "bg-violet-500/5" },
        ].map(({ icon: Icon, label, value, color, ring, bg }) => (
          <div key={label} className={`flex items-center gap-4 rounded-2xl border border-border ${bg} px-5 py-4`}>
            <div className={`w-10 h-10 rounded-xl ring-1 ${ring} ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted">{label}</p>
              <p className={`font-serif text-2xl font-medium ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Meus Cursos ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-foreground/70">Meus Cursos</p>
          <Link href="/instrutor/cursos" className="flex items-center gap-1 font-sans text-xs text-primary hover:underline">
            Ver todos <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center">
            <p className="font-sans text-sm text-muted">Nenhum curso atribuído ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {courses.map((course) => (
              <div key={course.id} className="group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/15 bg-surface">
                {/* Poster */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#0e4f6b] to-[#1a8fa8]" style={{ paddingBottom: "140%" }}>
                  {course.thumbnailUrl && (
                    <Image src={course.thumbnailUrl} alt={course.title} fill
                      className="absolute inset-0 object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 33vw, 20vw" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <span className={`absolute top-3 left-3 font-sans text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                    course.status === "PUBLISHED" ? "bg-green-500 text-white" :
                    course.status === "DRAFT"     ? "bg-amber-400 text-amber-900" : "bg-white/20 text-white"
                  }`}>
                    {statusLabels[course.status] ?? course.status}
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="font-sans text-[9px] font-bold uppercase tracking-widest text-white/50 mb-1">
                      {course._count.enrollments} alunos
                    </p>
                    <p className="font-sans text-sm font-bold text-white leading-snug line-clamp-2">{course.title}</p>
                  </div>
                </div>
                {/* Botões */}
                <div className="flex flex-col gap-1.5 p-2.5">
                  <Link href={`/dashboard/cursos/${course.slug}`} target="_blank"
                    className="w-full flex items-center justify-center gap-1.5 font-sans text-[11px] font-bold px-3 py-2 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors">
                    <PlayCircle className="w-3.5 h-3.5" /> Assistir
                  </Link>
                  <Link href={`/instrutor/cursos/${course.slug}`}
                    className="w-full flex items-center justify-center gap-1.5 font-sans text-[11px] font-semibold px-3 py-2 rounded-xl border border-border text-muted hover:text-foreground hover:border-primary/40 transition-colors">
                    <Settings className="w-3 h-3" /> Gerenciar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Próximas Aulas ao Vivo — cards Netflix ── */}
      {upcomingSessions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-foreground/70">Próximas Aulas ao Vivo</p>
            <Link href="/instrutor/aulas-ao-vivo" className="flex items-center gap-1 font-sans text-xs text-primary hover:underline">
              Gerenciar <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {upcomingSessions.map((s) => (
              <div key={s.id} className="group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-500/15 bg-surface">
                {/* Poster */}
                <div className="relative overflow-hidden bg-gradient-to-br from-violet-900 to-indigo-950" style={{ paddingBottom: "140%" }}>
                  {s.courseThumbnail && (
                    <Image src={s.courseThumbnail} alt={s.title} fill
                      className="absolute inset-0 object-cover opacity-40 transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 33vw, 20vw" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  {/* Badge AO VIVO */}
                  <span className="absolute top-3 left-3 flex items-center gap-1 font-sans text-[9px] font-bold uppercase tracking-widest bg-violet-500 text-white px-2 py-1 rounded-full shadow-lg">
                    <Radio className="w-2.5 h-2.5" /> ao vivo
                  </span>

                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="font-sans text-[9px] font-bold uppercase tracking-widest text-white/50 mb-1 line-clamp-1">
                      {s.courseTitle}
                    </p>
                    <p className="font-sans text-sm font-bold text-white leading-snug line-clamp-2 mb-2">{s.title}</p>
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1 font-sans text-[10px] text-white/70">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span className="capitalize">{fmtDate.format(new Date(s.startAt))}</span>
                        <span className="text-white/40">·</span>
                        <span>{fmtTime.format(new Date(s.startAt))}</span>
                      </span>
                      {s.location && (
                        <span className="flex items-center gap-1 font-sans text-[10px] text-white/60">
                          <MapPin className="w-3 h-3 shrink-0" />{s.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botão */}
                <div className="p-2.5">
                  {s.meetUrl ? (
                    <a href={s.meetUrl} target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 font-sans text-[11px] font-bold px-3 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-colors">
                      <Radio className="w-3.5 h-3.5" /> Entrar na aula
                    </a>
                  ) : (
                    <Link href="/instrutor/aulas-ao-vivo"
                      className="w-full flex items-center justify-center gap-1.5 font-sans text-[11px] font-semibold px-3 py-2 rounded-xl border border-border text-muted hover:text-foreground hover:border-violet-400/40 transition-colors">
                      <Settings className="w-3 h-3" /> Configurar link
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
