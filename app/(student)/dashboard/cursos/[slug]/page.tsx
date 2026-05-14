import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Award } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import LessonPlayer from "./LessonPlayer";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ aula?: string; sucesso?: string }>;
};

export default async function CoursePlayerPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { aula, sucesso } = await searchParams;

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard");

  const course = await prisma.course.findFirst({
    where: { slug },
    include: {
      instructor: { include: { user: true } },
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              duration: true,
              videoUrl: true,
              isFree: true,
              order: true,
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
            Meus cursos
          </Link>
          <span className="text-border">/</span>
          <span className="font-sans text-sm text-foreground font-medium line-clamp-1">
            {course.title}
          </span>
        </div>

        {enrollment.certificate && (
          <Link
            href={`/dashboard/certificados/${enrollment.certificate.id}`}
            className="flex items-center gap-1.5 font-sans text-xs font-semibold text-amber-600 hover:text-amber-500 transition-colors"
          >
            <Award className="w-4 h-4" />
            Ver certificado
          </Link>
        )}
      </div>

      {/* Sucesso após pagamento */}
      {sucesso && (
        <div className="mx-4 lg:mx-6 mt-4 flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-700 rounded-xl px-4 py-3 font-sans text-sm">
          <Award className="w-4 h-4 shrink-0" />
          Matrícula confirmada! Bem-vindo ao curso.
        </div>
      )}

      <LessonPlayer
        courseId={course.id}
        modules={course.modules}
        initialProgress={progressMap}
        initialLessonId={aula ?? null}
      />
    </div>
  );
}
