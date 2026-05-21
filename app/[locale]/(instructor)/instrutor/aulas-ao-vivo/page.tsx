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
  if (role !== "INSTRUCTOR") redirect("/dashboard");

  const instructor = await prisma.instructor.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!instructor) redirect("/dashboard");

  // Only fetch courses belonging to this instructor
  const [courses, liveSessions] = await Promise.all([
    prisma.course.findMany({
      where: { instructorId: instructor.id },
      select: { id: true, title: true, slug: true },
      orderBy: { title: "asc" },
    }),
    prisma.liveSession.findMany({
      where: { course: { instructorId: instructor.id } },
      include: { course: { select: { title: true, slug: true } } },
      orderBy: { startAt: "asc" },
    }),
  ]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-medium text-foreground">Aulas ao Vivo</h1>
        <p className="font-sans text-sm text-muted mt-1">
          Gerencie as sessões ao vivo dos seus cursos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="font-sans text-sm font-semibold text-foreground mb-5">
              Nova Sessão
            </h2>
            {courses.length === 0 ? (
              <p className="font-sans text-sm text-muted">
                Nenhum curso disponível. O administrador precisa atribuir cursos ao seu perfil primeiro.
              </p>
            ) : (
              <LiveSessionForm courses={courses} />
            )}
          </div>
        </div>
        <div className="lg:col-span-3">
          <LiveSessionList sessions={liveSessions} />
        </div>
      </div>
    </div>
  );
}
