import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  Award,
  Play,
  Clock,
  BookOpen,
  Shield,
  ExternalLink,
  Video,
  Calendar,
  Star,
  BarChart2,
  FileText,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import CurriculumAccordion from "./CurriculumAccordion";
import { CompleteCourseButton } from "./CompleteCourseButton";
import { ModuleQuizPanel } from "./ModuleQuizPanel";

type Props = {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ sucesso?: string }>;
};

const categoryLabel: Record<string, string> = {
  MEDICINA: "Medicina",
  GASTROENTEROLOGIA: "Gastroenterologia",
  CARDIOLOGIA: "Cardiologia",
  NEUROLOGIA: "Neurologia",
  PEDIATRIA: "Pediatria",
  CIRURGIA: "Cirurgia",
  ONCOLOGIA: "Oncologia",
  ENDOCRINOLOGIA: "Endocrinologia",
  DERMATOLOGIA: "Dermatologia",
  PSIQUIATRIA: "Psiquiatria",
  OUTROS: "Outros",
};

export default async function CourseOverviewPage({ params, searchParams }: Props) {
  const { slug, locale } = await params;
  const { sucesso } = await searchParams;

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard");

  const course = await prisma.course.findFirst({
    where: { slug },
    include: {
      instructor: {
        include: { user: { select: { name: true, image: true } } },
      },
      modules: {
        orderBy: { order: "asc" },
        include: {
          quiz: {
            include: {
              questions: {
                include: {
                  options: {
                    select: { id: true, text: true, isCorrect: false, order: true },
                    orderBy: { order: "asc" },
                  },
                },
                orderBy: { order: "asc" },
              },
            },
          },
          topics: {
            orderBy: { order: "asc" },
            include: {
              lessons: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  title: true,
                  duration: true,
                  videoUrl: true,
                  audioUrl: true,
                  muxPlaybackId: true,
                  isFree: true,
                  order: true,
                  instructors: {
                    include: { instructor: { include: { user: true } } },
                    orderBy: { order: "asc" },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!course) notFound();

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
    include: {
      progress: { select: { lessonId: true, completed: true } },
      certificate: true,
    },
  });

  if (!enrollment || (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED")) {
    redirect(`/cursos/${slug}`);
  }

  const progressMap: Record<string, boolean> = {};
  for (const p of enrollment.progress) progressMap[p.lessonId] = p.completed;

  const now = new Date();
  const allLessons = course.modules
    .filter((m) => !m.releaseDate || new Date(m.releaseDate) <= now)
    .flatMap((m) => m.topics.flatMap((t) => t.lessons));

  const totalLessons = course.modules.flatMap((m) => m.topics.flatMap((t) => t.lessons)).length;
  const doneLessons = Object.values(progressMap).filter(Boolean).length;
  const pct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

  // First incomplete lesson (for "Continuar" button)
  const nextLesson =
    allLessons.find((l) => !progressMap[l.id]) ?? allLessons[0] ?? null;

  // Module quiz attempts
  const moduleQuizIds = course.modules.flatMap((m) => (m.quiz ? [m.quiz.id] : []));
  const moduleQuizAttempts =
    moduleQuizIds.length > 0
      ? await prisma.moduleQuizAttempt.findMany({
          where: { userId: session.user.id, quizId: { in: moduleQuizIds } },
          orderBy: { createdAt: "desc" },
        })
      : [];

  // Next live session
  const nextLiveSession = await prisma.liveSession.findFirst({
    where: { courseId: course.id, startAt: { gte: new Date() } },
    orderBy: { startAt: "asc" },
  });

  const dateLocale = locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";

  const calendarUrl = nextLiveSession
    ? (() => {
        const fmt = (d: Date) =>
          d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
        const p = new URLSearchParams({
          action: "TEMPLATE",
          text: nextLiveSession.title,
          dates: `${fmt(nextLiveSession.startAt)}/${fmt(nextLiveSession.endAt)}`,
          details: nextLiveSession.meetUrl ? `Link: ${nextLiveSession.meetUrl}` : course.title,
          location: nextLiveSession.location ?? nextLiveSession.meetUrl ?? "",
        });
        return `https://calendar.google.com/calendar/render?${p.toString()}`;
      })()
    : null;

  // References count
  const referencesCount = await prisma.courseReference.count({
    where: { courseId: course.id },
  });

  const catLabel = categoryLabel[course.category] ?? course.category;

  return (
    <div className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8 min-h-screen bg-background">
      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden" style={{ minHeight: 300 }}>
        {/* Background image or gradient */}
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-canvas" />
        )}
        {/* Overlays */}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-canvas/95 via-canvas/70 to-canvas/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-transparent to-transparent" />

        {/* Breadcrumb */}
        <div className="relative z-10 px-6 lg:px-10 pt-6">
          <Link
            href="/dashboard/cursos"
            className="inline-flex items-center gap-1.5 font-sans text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Meus cursos
          </Link>
        </div>

        {/* Content */}
        <div className="relative z-10 px-6 lg:px-10 pb-10 pt-4 max-w-4xl">
          {/* Category badge */}
          <span className="inline-block font-sans text-[10px] font-bold uppercase tracking-widest text-white/70 border border-white/20 rounded-full px-3 py-1 mb-4 bg-white/5">
            {catLabel}
          </span>

          <h1 className="font-serif text-2xl lg:text-3xl font-medium text-white leading-tight mb-3 max-w-2xl">
            {course.title}
          </h1>

          {course.shortDesc && (
            <p className="font-sans text-sm text-white/60 max-w-xl leading-relaxed mb-5">
              {course.shortDesc}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-5 mb-5 flex-wrap">
            <div className="flex items-center gap-1.5 font-sans text-xs text-white/60">
              <Clock className="w-3.5 h-3.5" />
              {course.hours}h de conteúdo
            </div>
            <div className="flex items-center gap-1.5 font-sans text-xs text-white/60">
              <BookOpen className="w-3.5 h-3.5" />
              {totalLessons} aulas
            </div>
            {enrollment.certificate && (
              <div className="flex items-center gap-1.5 font-sans text-xs text-amber-400">
                <Award className="w-3.5 h-3.5" />
                Certificado disponível
              </div>
            )}
          </div>

          {/* Progress bar */}
          {totalLessons > 0 && (
            <div className="mb-6 max-w-sm">
              <div className="flex justify-between font-sans text-[11px] text-white/50 mb-1.5">
                <span>Seu progresso</span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {course.contentUrl && allLessons.length === 0 ? (
              <a
                href={course.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-sans text-sm font-semibold px-6 py-3 rounded-full bg-primary text-white hover:bg-primary-dark transition-all shadow-lg"
              >
                <Video className="w-4 h-4" />
                Entrar na aula
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            ) : nextLesson ? (
              <Link
                href={`/dashboard/cursos/${slug}/aulas/${nextLesson.id}`}
                className="inline-flex items-center gap-2 font-sans text-sm font-semibold px-6 py-3 rounded-full bg-white text-canvas hover:bg-white/90 transition-all shadow-lg"
              >
                <Play className="w-4 h-4 fill-canvas" />
                {pct > 0 ? "Continuar curso" : "Começar curso"}
              </Link>
            ) : null}

            {enrollment.certificate ? (
              <Link
                href={`/dashboard/certificados/${enrollment.certificate.id}`}
                className="inline-flex items-center gap-2 font-sans text-xs font-semibold px-4 py-2.5 rounded-full border border-amber-400/40 text-amber-400 hover:bg-amber-400/10 transition-colors"
              >
                <Award className="w-3.5 h-3.5" />
                Ver certificado
              </Link>
            ) : null}

            <Link
              href={`/dashboard/cursos/${slug}/resultado`}
              className="inline-flex items-center gap-2 font-sans text-xs font-semibold px-4 py-2.5 rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Desempenho
            </Link>

            <Link
              href={`/dashboard/cursos/${slug}/avaliacao`}
              className="inline-flex items-center gap-2 font-sans text-xs font-bold px-4 py-2.5 rounded-full bg-amber-400 text-amber-900 hover:bg-amber-300 transition-colors shadow-md shadow-amber-400/30"
            >
              <Star className="w-3.5 h-3.5 fill-amber-700" />
              Avaliar
            </Link>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-6 lg:px-10 py-8">
        {/* Success banner */}
        {sucesso && (
          <div className="mb-6 flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-700 rounded-xl px-4 py-3 font-sans text-sm">
            <Award className="w-4 h-4 shrink-0" />
            Matrícula confirmada! Bem-vindo ao curso.
          </div>
        )}

        {/* Next live session */}
        {nextLiveSession && (
          <div className="mb-6 bg-primary/8 border border-primary/20 rounded-2xl px-5 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                  Próxima aula ao vivo
                </p>
                <p className="font-sans text-sm font-semibold text-foreground">
                  {nextLiveSession.title}
                </p>
                <p className="font-sans text-xs text-muted mt-0.5">
                  {new Intl.DateTimeFormat(dateLocale, {
                    dateStyle: "full",
                    timeStyle: "short",
                    timeZone: "America/Sao_Paulo",
                  }).format(new Date(nextLiveSession.startAt))}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {nextLiveSession.meetUrl && (
                  <a
                    href={nextLiveSession.meetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans text-xs font-semibold px-4 py-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
                  >
                    Entrar no Meet
                  </a>
                )}
                {calendarUrl && (
                  <a
                    href={calendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold px-4 py-2 rounded-full border border-primary/30 text-primary hover:bg-primary/8 transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Adicionar à agenda
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: Curriculum ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Module quiz panels */}
            {course.modules.some((m) => m.quiz) && (
              <div className="space-y-3">
                {course.modules
                  .filter((m) => m.quiz)
                  .map((m) => {
                    const attempts = moduleQuizAttempts.filter(
                      (a) => a.quizId === m.quiz!.id
                    );
                    return (
                      <ModuleQuizPanel
                        key={m.id}
                        moduleTitle={m.title}
                        quiz={{
                          ...m.quiz!,
                          questions: m.quiz!.questions.map((q) => ({
                            ...q,
                            options: q.options.map(({ id, text, order }) => ({
                              id,
                              text,
                              order,
                            })),
                          })),
                        }}
                        previousAttempts={attempts.map((a) => ({
                          score: a.score,
                          total: a.total,
                          passed: a.passed,
                          createdAt: a.createdAt,
                        }))}
                      />
                    );
                  })}
              </div>
            )}

            <CurriculumAccordion
              courseSlug={slug}
              modules={course.modules as Parameters<typeof CurriculumAccordion>[0]["modules"]}
              progressMap={progressMap}
              currentLessonId={null}
            />
          </div>

          {/* ── Right: Info sidebar ── */}
          <div className="space-y-4">
            {/* Instructor card */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted mb-4">
                Professor responsável
              </p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 overflow-hidden shrink-0">
                  {course.instructor.user.image ? (
                    <Image
                      src={course.instructor.user.image}
                      alt={course.instructor.user.name ?? ""}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-sans text-sm font-bold text-primary">
                        {course.instructor.user.name?.[0] ?? "P"}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-sans text-sm font-semibold text-foreground">
                    {course.instructor.user.name}
                  </p>
                  {course.instructor.title && (
                    <p className="font-sans text-xs text-muted mt-0.5">
                      {course.instructor.title}
                    </p>
                  )}
                  {course.instructor.institution && (
                    <p className="font-sans text-[11px] text-muted/70 mt-0.5">
                      {course.instructor.institution}
                    </p>
                  )}
                </div>
              </div>
              {course.instructor.bio && (
                <p className="font-sans text-xs text-muted leading-relaxed line-clamp-4">
                  {course.instructor.bio}
                </p>
              )}
              {course.instructor.formation && (
                <p className="font-sans text-[11px] text-muted/70 mt-2 leading-relaxed">
                  {course.instructor.formation}
                </p>
              )}
            </div>

            {/* Certificate criteria */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-primary" />
                <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted">
                  Critérios para certificado
                </p>
              </div>
              <p className="font-sans text-xs text-muted leading-relaxed">
                Conclua todas as aulas obrigatórias e atinja a nota mínima nas avaliações previstas.
              </p>
              {!enrollment.certificate && allLessons.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between font-sans text-[11px] text-muted mb-1.5">
                    <span>Progresso geral</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="font-sans text-[11px] text-muted mt-2">
                    {doneLessons} de {totalLessons} aulas concluídas
                  </p>
                </div>
              )}
              {enrollment.certificate && (
                <div className="mt-4 pt-4 border-t border-border">
                  <Link
                    href={`/dashboard/certificados/${enrollment.certificate.id}`}
                    className="flex items-center gap-2 font-sans text-xs font-semibold text-amber-600 hover:text-amber-500 transition-colors"
                  >
                    <Award className="w-3.5 h-3.5" />
                    Baixar certificado
                  </Link>
                </div>
              )}
              {!enrollment.certificate && course.contentUrl && allLessons.length === 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <CompleteCourseButton courseId={course.id} />
                </div>
              )}
            </div>

            {/* References quick access */}
            {referencesCount > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-primary" />
                  <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted">
                    Referências
                  </p>
                </div>
                <p className="font-sans text-xs text-muted leading-relaxed">
                  {referencesCount} {referencesCount === 1 ? "artigo disponível" : "artigos disponíveis"} para este curso.
                </p>
                {nextLesson && (
                  <Link
                    href={`/dashboard/cursos/${slug}/aulas/${nextLesson.id}`}
                    className="mt-3 block font-sans text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    Ver referências no player →
                  </Link>
                )}
              </div>
            )}

            {/* Public page link */}
            <Link
              href={`/cursos/${slug}`}
              target="_blank"
              className="flex items-center gap-2 font-sans text-xs text-muted hover:text-foreground transition-colors px-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver página pública do curso
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
