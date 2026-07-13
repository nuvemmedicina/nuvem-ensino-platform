import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Award, Video, ExternalLink, Calendar, BarChart2, Star } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import LessonPlayer from "./LessonPlayer";
import { CompleteCourseButton } from "./CompleteCourseButton";
import { ModuleQuizPanel } from "./ModuleQuizPanel";
import { CourseContentCards } from "./CourseContentCards";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ aula?: string; sucesso?: string }>;
};

export default async function CoursePlayerPage({ params, searchParams }: Props) {
  const { slug, locale } = await params;
  const { aula, sucesso } = await searchParams;
  const t = await getTranslations({ locale, namespace: "dashboard.courses" });

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard");

  const course = await prisma.course.findFirst({
    where: { slug },
    include: {
      instructor: { include: { user: true } },
      _count: { select: { modules: true } },
      // contentUrl needed for Google Meet / external platform links
      modules: {
        orderBy: { order: "asc" },
        include: {
          instructors: {
            include: { instructor: { include: { user: true } } },
            orderBy: { order: "asc" },
          },
          quiz: {
            include: {
              questions: {
                include: { options: { select: { id: true, text: true, isCorrect: false, order: true }, orderBy: { order: "asc" } } },
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
                  description: true,
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
                  quiz: {
                    include: {
                      questions: {
                        include: {
                          options: {
                            select: { id: true, text: true, order: true },
                            orderBy: { order: "asc" },
                          },
                        },
                        orderBy: { order: "asc" },
                      },
                    },
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
  for (const p of enrollment.progress) {
    progressMap[p.lessonId] = p.completed;
  }

  // Monta mapa lessonId → quiz (sem isCorrect para o aluno)
  const quizzesMap: Record<string, { id: string; title: string; questions: Array<{ id: string; text: string; order: number; options: Array<{ id: string; text: string; order: number }> }> }> = {};
  for (const mod of course.modules) {
    for (const topic of mod.topics) {
      for (const lesson of topic.lessons) {
        if (lesson.quiz) {
          quizzesMap[lesson.id] = lesson.quiz;
        }
      }
    }
  }

  // Busca tentativas anteriores do aluno
  const allQuizIds = Object.values(quizzesMap).map((q) => q.id);
  const rawAttempts = allQuizIds.length > 0
    ? await prisma.quizAttempt.findMany({
        where: { userId: session.user.id, quizId: { in: allQuizIds } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Deduplica: mantém apenas a tentativa mais recente por quizId
  const previousAttemptsMap: Record<string, { score: number; total: number }> = {};
  for (const attempt of rawAttempts) {
    if (!previousAttemptsMap[attempt.quizId]) {
      previousAttemptsMap[attempt.quizId] = { score: attempt.score, total: attempt.total };
    }
  }

  // Busca tentativas de provas de módulo do aluno
  const moduleQuizIds = course.modules.flatMap((m) => m.quiz ? [m.quiz.id] : []);
  const moduleQuizAttempts = moduleQuizIds.length > 0
    ? await prisma.moduleQuizAttempt.findMany({
        where: { userId: session.user.id, quizId: { in: moduleQuizIds } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Sanitiza módulos bloqueados: remove dados de vídeo server-side para não vazar ao cliente
  const now = new Date();
  const sanitizedModules = course.modules.map((mod) => {
    const locked = mod.releaseDate && new Date(mod.releaseDate) > now;
    if (!locked) return mod;
    return {
      ...mod,
      topics: mod.topics.map((topic) => ({
        ...topic,
        lessons: topic.lessons.map((lesson) => ({
          ...lesson,
          videoUrl: null,
          muxPlaybackId: null,
        })),
      })),
    };
  });

  // Busca anotações do aluno para todas as aulas deste curso
  const allLessonIds = course.modules.flatMap((m) => m.topics.flatMap((t) => t.lessons.map((l) => l.id)));
  const notesData = await prisma.note.findMany({
    where: { userId: session.user.id, lessonId: { in: allLessonIds } },
    select: { lessonId: true, content: true },
  });
  const notesMap: Record<string, string> = {};
  for (const n of notesData) {
    notesMap[n.lessonId] = n.content;
  }

  const courseReferences = await prisma.courseReference.findMany({
    where: { courseId: course.id },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  const nextLiveSession = await prisma.liveSession.findFirst({
    where: { courseId: course.id, startAt: { gte: new Date() } },
    orderBy: { startAt: "asc" },
  });

  const dateLocale = locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";

  const calendarUrl = nextLiveSession
    ? (() => {
        const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
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

  return (
    <div className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8">
      {/* Topbar */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-border bg-surface">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 font-sans text-sm text-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {t("title")}
          </Link>
          <span className="text-border">/</span>
          <span className="font-sans text-sm text-foreground font-medium line-clamp-1">
            {course.title}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/cursos/${slug}/resultado`}
            className="flex items-center gap-1.5 font-sans text-xs font-semibold text-muted hover:text-foreground transition-colors"
          >
            <BarChart2 className="w-4 h-4" />
            Desempenho
          </Link>
          <Link
            href={`/dashboard/cursos/${slug}/avaliacao`}
            className="flex items-center gap-1.5 font-sans text-xs font-semibold text-muted hover:text-amber-500 transition-colors"
          >
            <Star className="w-4 h-4" />
            Avaliar
          </Link>
          {enrollment.certificate && (
            <Link
              href={`/dashboard/certificados/${enrollment.certificate.id}`}
              className="flex items-center gap-1.5 font-sans text-xs font-semibold text-amber-600 hover:text-amber-500 transition-colors"
            >
              <Award className="w-4 h-4" />
              {t("viewCertificate")}
            </Link>
          )}
        </div>
      </div>

      {/* Sucesso após pagamento */}
      {sucesso && (
        <div className="mx-4 lg:mx-6 mt-4 flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-700 rounded-xl px-4 py-3 font-sans text-sm">
          <Award className="w-4 h-4 shrink-0" />
          {t("enrollmentConfirmed")}
        </div>
      )}

      {/* Próxima aula ao vivo */}
      {nextLiveSession && (
        <div className="mx-4 lg:mx-6 mt-6 mb-6 bg-primary/10 border border-primary/20 rounded-xl px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">
                {t("nextLive")}
              </p>
              <p className="font-sans text-sm font-semibold text-foreground">{nextLiveSession.title}</p>
              <p className="font-sans text-xs text-muted mt-0.5">
                {new Intl.DateTimeFormat(dateLocale, { dateStyle: "full", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(nextLiveSession.startAt))}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {nextLiveSession.meetUrl && (
                <a href={nextLiveSession.meetUrl} target="_blank" rel="noopener noreferrer"
                  className="font-sans text-xs font-semibold px-4 py-2 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors">
                  {t("joinMeet")}
                </a>
              )}
              {calendarUrl && (
                <a href={calendarUrl} target="_blank" rel="noopener noreferrer"
                  className="font-sans text-xs font-semibold px-4 py-2 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors">
                  {t("addToCalendar")}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Link de aula externa (Google Meet / plataforma online) ── */}
      {course.contentUrl && course.modules.flatMap((m) => m.topics.flatMap((t) => t.lessons)).length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-16">
          <div className="w-full max-w-lg">
            {/* Player placeholder */}
            <div className="relative w-full rounded-2xl overflow-hidden mb-8 bg-canvas"
              style={{ aspectRatio: "16/9" }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                {/* Animated ring */}
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <span className="absolute inset-0 rounded-full border-2 border-accent/30 animate-ping" />
                  <span className="absolute inset-0 rounded-full border border-accent/20" />
                  <div className="w-16 h-16 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center">
                    <Video className="w-7 h-7 text-accent" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-sans text-sm font-semibold text-white/80 mb-1">
                    Aula ao vivo
                  </p>
                  <p className="font-sans text-xs text-white/40">
                    Acesse pelo botão abaixo quando a aula começar
                  </p>
                </div>
              </div>
            </div>

            {/* Card de acesso */}
            <div className="bg-surface border border-border rounded-2xl p-6 text-center space-y-5">
              <div>
                <h2 className="font-serif text-xl font-medium text-foreground mb-1">{course.title}</h2>
                <p className="font-sans text-sm text-muted">
                  Esta é uma aula online ao vivo. Clique no botão para entrar na sala.
                </p>
              </div>

              <a
                href={course.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 font-sans text-sm font-semibold px-8 py-3.5 rounded-full bg-primary text-white hover:bg-primary-dark hover:shadow-[0_4px_20px_rgba(0,71,94,0.35)] transition-all duration-200"
              >
                <Video className="w-4 h-4" />
                Entrar na aula
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>

              {nextLiveSession && calendarUrl && (
                <div className="pt-2 border-t border-border">
                  <a
                    href={calendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-sans text-xs text-muted hover:text-foreground transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Adicionar ao Google Calendar
                  </a>
                </div>
              )}

              {!enrollment.certificate && (
                <div className="pt-4 border-t border-border">
                  <CompleteCourseButton courseId={course.id} />
                </div>
              )}
              {enrollment.certificate && (
                <div className="pt-4 border-t border-border flex items-center justify-center gap-2 font-sans text-sm font-semibold text-green-600">
                  <Award className="w-4 h-4" />
                  Certificado disponível em{" "}
                  <Link href="/dashboard/certificados" className="underline underline-offset-2">
                    Certificados
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
        {/* ── Cards de conteúdo ── */}
        {(() => {
          const allLessons = course.modules.flatMap((m) => m.topics.flatMap((t) => t.lessons));
          const audioTotal = allLessons.filter((l) => l.audioUrl).length;
          const quizModules = course.modules.filter((m) => m.quiz);
          const quizTotal = quizModules.length;
          const quizPassed = quizModules.filter((m) =>
            moduleQuizAttempts.some((a) => a.quizId === m.quiz!.id && a.passed)
          ).length;
          return (
            <CourseContentCards
              quizTotal={quizTotal}
              quizPassed={quizPassed}
              audioTotal={audioTotal}
            />
          );
        })()}

        {/* ── Provas de módulo ── */}
        {course.modules.some((m) => m.quiz) && (
          <div className="mx-4 lg:mx-6 mt-4 mb-2 space-y-3">
            {course.modules
              .filter((m) => m.quiz)
              .map((m) => {
                const attempts = moduleQuizAttempts.filter((a) => a.quizId === m.quiz!.id);
                return (
                  <ModuleQuizPanel
                    key={m.id}
                    moduleTitle={m.title}
                    quiz={{
                      ...m.quiz!,
                      questions: m.quiz!.questions.map((q) => ({
                        ...q,
                        options: q.options.map(({ id, text, order }) => ({ id, text, order })),
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
        <LessonPlayer
          courseId={course.id}
          courseTitle={course.title}
          modules={sanitizedModules}
          initialProgress={progressMap}
          initialLessonId={aula ?? null}
          initialNotes={notesMap}
          quizzes={quizzesMap}
          previousAttempts={previousAttemptsMap}
          initialCertificateId={enrollment.certificate?.id ?? null}
          currentUserId={session.user.id}
          currentUserRole={(session.user as { role?: string }).role ?? "STUDENT"}
          currentUserName={session.user.name ?? null}
          courseReferences={courseReferences}
        />
        </>
      )}
    </div>
  );
}
