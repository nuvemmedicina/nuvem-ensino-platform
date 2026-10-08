import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calcularDominioPorTema } from "@/lib/gamification";
import { traduzirModulos } from "@/lib/i18n-content";
import { NovaPaginaCurso, ABAS, type Aba } from "./NovaPaginaCurso";

const DICI_WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/Bu30QwD28QP2FJbYW8wMdp";
// Cursos de teste respiratório (online e presencial) que ganham o jogo de
// casos clínicos de interpretação de H₂/CH₄.
const RESPIRATORY_GAME_COURSE_SLUGS = [
  "teste-respiratorio-de-hidrogenio-e-metano",
  "testes-respiratorios-h2-ch4-h2s-outubro",
];

type Props = {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ sucesso?: string; aba?: string }>;
};

export default async function CourseOverviewPage({ params, searchParams }: Props) {
  const { slug, locale } = await params;
  const { sucesso, aba } = await searchParams;

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard");

  const courseRaw = await prisma.course.findFirst({
    where: { slug },
    include: {
      instructor: {
        include: { user: { select: { name: true, image: true } } },
      },
      modules: {
        orderBy: { order: "asc" },
        include: {
          // As questões não são carregadas aqui: elas são sorteadas por aluno
          // quando a prova começa (startModuleQuiz), então nem o enunciado nem
          // as alternativas chegam ao navegador antes disso.
          quiz: {
            select: {
              id: true,
              title: true,
              availableFrom: true,
              availableUntil: true,
              passingPct: true,
              maxAttempts: true,
              questionsPerAttempt: true,
              practiceEnabled: true,
              _count: { select: { questions: true } },
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
                  titleEs: true,
                  titleEn: true,
                  duration: true,
                  type: true,
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
              flashcardGroups: {
                where: { cards: { some: {} } },
                orderBy: { createdAt: "asc" },
                take: 1,
                select: { id: true, _count: { select: { cards: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!courseRaw) notFound();
  // Títulos de curso, módulos, temas e aulas no idioma do aluno (vazio = português)
  const course = {
    ...courseRaw,
    title: (locale === "es" ? courseRaw.titleEs : locale === "en" ? courseRaw.titleEn : null) || courseRaw.title,
    modules: traduzirModulos(courseRaw.modules, locale),
  };

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

  // Provas: aparecem conforme os módulos vão sendo liberados, uma de cada vez.
  // Mostramos a prova que o aluno precisa fazer agora — a primeira, na ordem do
  // curso, que ainda está em aberto para ele. Quando não há nenhuma pendente,
  // fica visível a prova do módulo liberado mais recente, para ele continuar
  // vendo o resultado.
  const releasedQuizModules = course.modules.filter(
    (m) => m.quiz && (!m.releaseDate || new Date(m.releaseDate) <= now),
  );

  const isQuizOpen = (m: (typeof releasedQuizModules)[number]) => {
    const q = m.quiz!;
    const attempts = moduleQuizAttempts.filter((a) => a.quizId === q.id);
    const windowOpen =
      (!q.availableFrom || new Date(q.availableFrom) <= now) &&
      (!q.availableUntil || new Date(q.availableUntil) >= now);
    return (
      windowOpen &&
      q._count.questions > 0 &&
      !attempts.some((a) => a.passed) &&
      attempts.length < q.maxAttempts
    );
  };

  const currentQuizModule =
    releasedQuizModules.find(isQuizOpen) ??
    releasedQuizModules[releasedQuizModules.length - 1] ??
    null;

  // Desempenho por tema — só existe depois que o aluno faz a primeira prova
  const dominioTemas = await calcularDominioPorTema(course.id, session.user.id);

  // Página do curso (a área antiga foi removida em 08/10/2026)
  const [referencias, aoVivo] = await Promise.all([
    prisma.courseReference.findMany({
      where: { courseId: course.id },
      orderBy: { order: "asc" },
      select: { id: true, title: true, fileUrl: true },
    }),
    // Inclui a aula que já começou e ainda não terminou
    prisma.liveSession.findFirst({
      where: { courseId: course.id, endAt: { gte: now } },
      orderBy: { startAt: "asc" },
    }),
  ]);
  const fmtCal = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return (
    <NovaPaginaCurso
      locale={locale}
      aba={(ABAS as readonly string[]).includes(aba ?? "") ? (aba as Aba) : "aulas"}
      sucesso={!!sucesso}
      course={course}
      progressMap={progressMap}
      nextLesson={nextLesson}
      tentativas={moduleQuizAttempts}
      provaAtualId={currentQuizModule?.quiz?.id ?? null}
      aoVivo={
        aoVivo
          ? {
              title: aoVivo.title,
              startAt: aoVivo.startAt,
              endAt: aoVivo.endAt,
              meetUrl: aoVivo.meetUrl,
              calendarUrl: `https://calendar.google.com/calendar/render?${new URLSearchParams({
                action: "TEMPLATE",
                text: aoVivo.title,
                dates: `${fmtCal(aoVivo.startAt)}/${fmtCal(aoVivo.endAt)}`,
                details: aoVivo.meetUrl ? `Link: ${aoVivo.meetUrl}` : course.title,
                location: aoVivo.location ?? aoVivo.meetUrl ?? "",
              }).toString()}`,
            }
          : null
      }
      dominioTemas={dominioTemas}
      certificadoId={enrollment.certificate?.id ?? null}
      referencias={referencias}
      whatsappUrl={course.slug === "dici-neurogastroenterologia-2026" ? DICI_WHATSAPP_GROUP_URL : null}
      temJogo={RESPIRATORY_GAME_COURSE_SLUGS.includes(course.slug)}
    />
  );
}
