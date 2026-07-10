import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Play, ChevronRight, Award, Info } from "lucide-react";
import { getTranslations } from "next-intl/server";

async function getDashboardData(userId: string) {
  const [enrollments, certificates] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId, status: { in: ["ACTIVE", "COMPLETED"] } },
      include: {
        course: {
          include: {
            instructor: { include: { user: { select: { name: true, image: true } } } },
            modules: { include: { lessons: { select: { id: true } } } },
          },
        },
        progress: { select: { lessonId: true, completed: true } },
      },
      orderBy: { enrolledAt: "desc" },
    }),
    prisma.certificate.count({ where: { userId } }),
  ]);
  return { enrollments, certificatesCount: certificates };
}

function calcProgress(progress: { completed: boolean }[], totalLessons: number): number {
  if (totalLessons === 0) return 0;
  return Math.round((progress.filter((p) => p.completed).length / totalLessons) * 100);
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard");
  const { enrollments, certificatesCount } = await getDashboardData(session.user.id);

  const activeEnrollments = enrollments.filter((e) => e.status === "ACTIVE");
  const completedEnrollments = enrollments.filter((e) => e.status === "COMPLETED");
  const firstName = session.user?.name?.split(" ")[0] ?? "";

  // Curso hero: o primeiro ativo com maior progresso parcial (ou primeiro ativo)
  const heroEnrollment = activeEnrollments[0] ?? completedEnrollments[0] ?? null;
  const heroTotalLessons = heroEnrollment
    ? heroEnrollment.course.modules.reduce((s, m) => s + m.lessons.length, 0)
    : 0;
  const heroPct = heroEnrollment ? calcProgress(heroEnrollment.progress, heroTotalLessons) : 0;

  return (
    <div className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8 min-h-screen bg-background">

      {/* ── HERO ── */}
      {heroEnrollment ? (
        <div className="relative w-full" style={{ aspectRatio: "21/9", minHeight: 280, maxHeight: 520 }}>
          {/* Thumbnail background */}
          {heroEnrollment.course.thumbnailUrl ? (
            <Image
              src={heroEnrollment.course.thumbnailUrl}
              alt={heroEnrollment.course.title}
              fill
              className="object-cover"
              style={{ objectPosition: "center 20%" }}
              priority
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-canvas to-primary/30" />
          )}

          {/* Gradients */}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end px-8 lg:px-12 pb-10 lg:pb-14">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-white/50 mb-2">
              {heroEnrollment.status === "COMPLETED" ? "Concluído" : "Continue assistindo"}
            </p>
            <h1 className="font-serif text-2xl lg:text-4xl font-medium text-white max-w-xl leading-tight mb-3">
              {heroEnrollment.course.title}
            </h1>
            {heroEnrollment.course.shortDesc && (
              <p className="font-sans text-sm text-white/60 max-w-md line-clamp-2 mb-4 hidden lg:block">
                {heroEnrollment.course.shortDesc}
              </p>
            )}

            {heroTotalLessons > 0 && (
              <div className="mb-4 max-w-xs">
                <div className="flex justify-between font-sans text-[10px] text-white/50 mb-1">
                  <span>{heroPct}% concluído</span>
                  <span>{heroTotalLessons} aulas</span>
                </div>
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${heroPct}%` }} />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Link
                href={`/dashboard/cursos/${heroEnrollment.course.slug}`}
                className="flex items-center gap-2 font-sans text-sm font-bold px-6 py-3 rounded-full bg-white text-black hover:bg-white/90 transition-all"
              >
                <Play className="w-4 h-4 fill-black" />
                {heroPct > 0 ? "Continuar" : "Assistir"}
              </Link>
              <Link
                href={`/cursos/${heroEnrollment.course.slug}`}
                className="flex items-center gap-2 font-sans text-sm font-semibold px-6 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-all"
              >
                <Info className="w-4 h-4" />
                Detalhes
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex items-end px-8 lg:px-12 pb-12 bg-gradient-to-br from-canvas to-primary/20" style={{ minHeight: 280 }}>
          <div>
            <h1 className="font-serif text-3xl font-light text-white mb-2">
              Olá, {firstName}
            </h1>
            <p className="font-sans text-sm text-white/60 mb-6">Explore os nossos cursos</p>
            <Link href="/cursos" className="flex items-center gap-2 font-sans text-sm font-bold px-6 py-3 rounded-full bg-white text-black hover:bg-white/90 transition-all w-fit">
              <Play className="w-4 h-4 fill-black" />
              Ver cursos
            </Link>
          </div>
        </div>
      )}

      {/* ── CONTEÚDO ── */}
      <div className="px-4 lg:px-8 py-8 space-y-10 bg-background">

        {/* Stats chips */}
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { label: `${activeEnrollments.length} em andamento`, color: "text-primary", bg: "bg-primary/8 border-primary/20" },
            { label: `${completedEnrollments.length} concluídos`,  color: "text-green-700", bg: "bg-green-500/10 border-green-500/20" },
            { label: `${certificatesCount} certificados`,           color: "text-amber-700", bg: "bg-amber-500/10 border-amber-500/20" },
          ].map(({ label, color, bg }) => (
            <span key={label} className={`font-sans text-xs font-semibold ${color} ${bg} border px-3 py-1.5 rounded-full`}>
              {label}
            </span>
          ))}
        </div>

        {/* Carrossel: Em andamento */}
        {activeEnrollments.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-sans text-base font-semibold text-foreground">Continuar assistindo</h2>
              <Link href="/dashboard/cursos" className="font-sans text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                Ver todos <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none -mx-4 lg:-mx-8 px-4 lg:px-8">
              {activeEnrollments.map((e) => {
                const total = e.course.modules.reduce((s, m) => s + m.lessons.length, 0);
                const pct = calcProgress(e.progress, total);
                return (
                  <CourseCard
                    key={e.id}
                    href={`/dashboard/cursos/${e.course.slug}`}
                    title={e.course.title}
                    thumbnail={e.course.thumbnailUrl ?? e.course.instructor.user.image}
                    instructorName={e.course.instructor.user.name}
                    pct={pct}
                    hours={e.course.hours}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Carrossel: Concluídos */}
        {completedEnrollments.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-sans text-base font-semibold text-foreground">Cursos concluídos</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none -mx-4 lg:-mx-8 px-4 lg:px-8">
              {completedEnrollments.map((e) => (
                <CourseCard
                  key={e.id}
                  href={`/dashboard/cursos/${e.course.slug}`}
                  title={e.course.title}
                  thumbnail={e.course.thumbnailUrl ?? e.course.instructor.user.image}
                  instructorName={e.course.instructor.user.name}
                  pct={100}
                  hours={e.course.hours}
                  completed
                />
              ))}
            </div>
          </section>
        )}

        {/* Vazio */}
        {enrollments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="font-serif text-2xl text-muted mb-2">Nenhum curso ainda</p>
            <p className="font-sans text-sm text-muted/70 mb-6">Explore nossa grade de cursos para médicos</p>
            <Link href="/cursos" className="font-sans text-sm font-bold px-6 py-3 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors">
              Explorar cursos
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Card de curso ──────────────────────────────────────────────────────────────
function CourseCard({
  href, title, thumbnail, instructorName, pct, hours, completed,
}: {
  href: string;
  title: string;
  thumbnail: string | null | undefined;
  instructorName: string | null | undefined;
  pct: number;
  hours: number;
  completed?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative shrink-0 w-[200px] sm:w-[260px] rounded-xl overflow-hidden bg-canvas border border-white/10 hover:border-primary/50 hover:scale-105 transition-all duration-300 shadow-lg"
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-[5/4] bg-black/40">
        {thumbnail ? (
          <Image src={thumbnail} alt={title} fill className="object-cover object-center group-hover:opacity-80 transition-opacity" sizes="240px" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
            <Play className="w-8 h-8 text-white/30" />
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 fill-black text-black ml-0.5" />
          </div>
        </div>

        {/* Completed badge */}
        {completed && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500/90 text-white font-sans text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Award className="w-3 h-3" /> Concluído
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-sans text-xs font-semibold text-white leading-snug line-clamp-2 mb-1">{title}</h3>
        <p className="font-sans text-[10px] text-white/40">{instructorName} · {hours}h</p>

        {/* Progress bar */}
        {pct > 0 && pct < 100 && (
          <div className="mt-2 h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
    </Link>
  );
}
