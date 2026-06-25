import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CheckCircle, Circle, Award, Download, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string; locale: string }> };

export default async function ResultadoPage({ params }: Props) {
  const { slug, locale } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard");

  const course = await prisma.course.findFirst({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: { id: true, title: true, quiz: { select: { id: true, title: true } } },
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

  // Quiz scores
  const allQuizIds = course.modules
    .flatMap((m) => m.lessons)
    .flatMap((l) => (l.quiz ? [l.quiz.id] : []));

  const attempts = allQuizIds.length > 0
    ? await prisma.quizAttempt.findMany({
        where: { userId: session.user.id, quizId: { in: allQuizIds } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const bestAttempt: Record<string, { score: number; total: number }> = {};
  for (const a of attempts) {
    if (!bestAttempt[a.quizId] || a.score > bestAttempt[a.quizId].score) {
      bestAttempt[a.quizId] = { score: a.score, total: a.total };
    }
  }

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const totalLessons = allLessons.length;
  const completedLessons = allLessons.filter((l) => progressMap[l.id]).length;
  const overallPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const dateLocale = locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";

  return (
    <div className="max-w-2xl">
      <Link
        href={`/dashboard/cursos/${slug}`}
        className="inline-flex items-center gap-1.5 font-sans text-sm text-muted hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Voltar ao curso
      </Link>

      <div className="mb-6">
        <h1 className="font-serif text-2xl font-medium text-foreground">{course.title}</h1>
        <p className="font-sans text-sm text-muted mt-1">Seu desempenho no curso</p>
      </div>

      {/* Resumo geral */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Trophy className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-0.5">
              Progresso geral
            </p>
            <p className="font-serif text-3xl font-medium text-foreground">{overallPct}%</p>
          </div>
        </div>

        <div className="w-full h-2 bg-border rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <p className="font-sans text-xs text-muted">
          {completedLessons} de {totalLessons} aulas concluídas
        </p>

        {enrollment.certificate && (
          <div className="mt-5 pt-5 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="font-sans text-sm font-semibold text-foreground">Certificado emitido</span>
              <span className="font-sans text-xs text-muted">
                · {new Intl.DateTimeFormat(dateLocale).format(new Date(enrollment.certificate.issueDate))}
              </span>
            </div>
            <a
              href={`/api/certificates/${enrollment.certificate.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar PDF
            </a>
          </div>
        )}
      </div>

      {/* Por módulo */}
      <div className="flex flex-col gap-4">
        {course.modules.map((mod) => {
          const modLessons = mod.lessons;
          const modCompleted = modLessons.filter((l) => progressMap[l.id]).length;
          const modPct = modLessons.length > 0
            ? Math.round((modCompleted / modLessons.length) * 100)
            : 0;

          const quizLessons = modLessons.filter((l) => l.quiz);
          const totalQuizScore = quizLessons.reduce((sum, l) => {
            const a = bestAttempt[l.quiz!.id];
            return sum + (a ? a.score : 0);
          }, 0);
          const totalQuizMax = quizLessons.reduce((sum, l) => {
            const a = bestAttempt[l.quiz!.id];
            return sum + (a ? a.total : 0);
          }, 0);

          return (
            <div key={mod.id} className="bg-surface border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-sans text-sm font-semibold text-foreground">{mod.title}</h3>
                  <span className="font-sans text-xs font-bold text-primary">{modPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${modPct === 100 ? "bg-green-500" : "bg-primary"}`}
                    style={{ width: `${modPct}%` }}
                  />
                </div>
                <p className="font-sans text-[10px] text-muted mt-1.5">
                  {modCompleted}/{modLessons.length} aulas
                  {totalQuizMax > 0 && (
                    <> · Quiz: <span className={`font-semibold ${totalQuizScore / totalQuizMax >= 0.7 ? "text-green-600" : "text-amber-600"}`}>
                      {totalQuizScore}/{totalQuizMax} pontos
                    </span></>
                  )}
                </p>
              </div>

              <div className="divide-y divide-border/60">
                {modLessons.map((lesson) => {
                  const done = progressMap[lesson.id];
                  const quiz = lesson.quiz ? bestAttempt[lesson.quiz.id] : undefined;
                  return (
                    <div key={lesson.id} className="flex items-center gap-3 px-5 py-2.5">
                      {done ? (
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted/30 shrink-0" />
                      )}
                      <span className={`font-sans text-xs flex-1 ${done ? "text-foreground" : "text-muted"}`}>
                        {lesson.title}
                      </span>
                      {quiz && (
                        <span className={`font-sans text-[10px] font-semibold shrink-0 ${quiz.score / quiz.total >= 0.7 ? "text-green-600" : "text-amber-600"}`}>
                          {quiz.score}/{quiz.total}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
