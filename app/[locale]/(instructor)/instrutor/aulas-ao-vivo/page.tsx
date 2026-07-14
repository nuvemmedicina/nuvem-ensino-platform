import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LiveSessionForm from "./LiveSessionForm";
import LiveSessionList from "./LiveSessionList";

export default async function InstructorAulasAoVivoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/instrutor/aulas-ao-vivo");

  const role = (session.user as { role?: string }).role;
  if (role !== "INSTRUCTOR" && role !== "ADMIN") redirect("/dashboard");

  const instructor = await prisma.instructor.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!instructor) redirect("/dashboard");

  const courseFilter = {
    OR: [
      { instructorId: instructor.id },
      { modules: { some: { instructors: { some: { instructorId: instructor.id } } } } },
    ],
  };

  const [courses, liveSessions] = await Promise.all([
    prisma.course.findMany({
      where: courseFilter,
      select: { id: true, title: true, slug: true },
      orderBy: { title: "asc" },
    }),
    prisma.liveSession.findMany({
      where: { course: courseFilter },
      include: { course: { select: { title: true, slug: true, thumbnailUrl: true } } },
      orderBy: { startAt: "asc" },
    }),
  ]);

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-light text-foreground">Aulas ao Vivo</h1>
          <p className="font-sans text-sm text-muted mt-1">
            Gerencie as sessões ao vivo dos seus cursos
          </p>
        </div>
      </div>

      {/* Formulário nova sessão */}
      {courses.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-6 mb-8">
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-5">
            Agendar nova sessão
          </h2>
          <LiveSessionForm courses={courses} />
        </div>
      )}

      {courses.length === 0 && (
        <div className="bg-surface border border-border rounded-2xl p-8 text-center mb-8">
          <p className="font-sans text-sm text-muted">
            Nenhum curso disponível. O administrador precisa atribuir cursos ao seu perfil primeiro.
          </p>
        </div>
      )}

      {/* Lista de sessões */}
      <LiveSessionList sessions={liveSessions} />
    </div>
  );
}
