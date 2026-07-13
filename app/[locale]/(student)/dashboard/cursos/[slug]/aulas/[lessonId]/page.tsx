import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import LessonPlayerClient from "./LessonPlayerClient";

type Props = {
  params: Promise<{ slug: string; lessonId: string; locale: string }>;
};

export default async function LessonPage({ params }: Props) {
  const { slug, lessonId } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard");

  const course = await prisma.course.findFirst({
    where: { slug },
    include: {
      instructor: { include: { user: true } },
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

  // Sanitize locked modules
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

  // Find requested lesson
  const allLessons = sanitizedModules.flatMap((m) => m.topics.flatMap((t) => t.lessons));
  const currentLesson = allLessons.find((l) => l.id === lessonId);
  if (!currentLesson) notFound();

  // Check if lesson's module is locked
  const lessonModule = sanitizedModules.find((m) =>
    m.topics.some((t) => t.lessons.some((l) => l.id === lessonId))
  );
  if (lessonModule?.releaseDate && new Date(lessonModule.releaseDate) > now) {
    redirect(`/dashboard/cursos/${slug}`);
  }

  const progressMap: Record<string, boolean> = {};
  for (const p of enrollment.progress) progressMap[p.lessonId] = p.completed;

  // Build quizzes map
  const quizzesMap: Record<string, { id: string; title: string; questions: Array<{ id: string; text: string; order: number; options: Array<{ id: string; text: string; order: number }> }> }> = {};
  for (const mod of sanitizedModules) {
    for (const topic of mod.topics) {
      for (const lesson of topic.lessons) {
        if (lesson.quiz) quizzesMap[lesson.id] = lesson.quiz;
      }
    }
  }

  // Previous quiz attempts
  const allQuizIds = Object.values(quizzesMap).map((q) => q.id);
  const rawAttempts =
    allQuizIds.length > 0
      ? await prisma.quizAttempt.findMany({
          where: { userId: session.user.id, quizId: { in: allQuizIds } },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const previousAttemptsMap: Record<string, { score: number; total: number }> = {};
  for (const attempt of rawAttempts) {
    if (!previousAttemptsMap[attempt.quizId]) {
      previousAttemptsMap[attempt.quizId] = { score: attempt.score, total: attempt.total };
    }
  }

  // Notes
  const allLessonIds = allLessons.map((l) => l.id);
  const notesData = await prisma.note.findMany({
    where: { userId: session.user.id, lessonId: { in: allLessonIds } },
    select: { lessonId: true, content: true },
  });
  const notesMap: Record<string, string> = {};
  for (const n of notesData) notesMap[n.lessonId] = n.content;

  // References
  const courseReferences = await prisma.courseReference.findMany({
    where: { courseId: course.id },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return (
    <LessonPlayerClient
      courseId={course.id}
      courseSlug={slug}
      courseTitle={course.title}
      modules={sanitizedModules}
      currentLessonId={lessonId}
      initialProgress={progressMap}
      initialNotes={notesMap}
      quizzes={quizzesMap}
      previousAttempts={previousAttemptsMap}
      initialCertificateId={enrollment.certificate?.id ?? null}
      currentUserId={session.user.id}
      currentUserRole={(session.user as { role?: string }).role ?? "STUDENT"}
      currentUserName={session.user.name ?? null}
      courseReferences={courseReferences}
    />
  );
}
