import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LiveSessionForm from "./LiveSessionForm";
import LiveSessionList from "./LiveSessionList";

export default async function AulasAoVivoPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const [courses, liveSessions] = await Promise.all([
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true, slug: true },
      orderBy: { title: "asc" },
    }),
    prisma.liveSession.findMany({
      include: { course: { select: { title: true, slug: true } } },
      orderBy: { startAt: "asc" },
    }),
  ]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-medium text-foreground">Aulas ao Vivo</h1>
        <p className="font-sans text-sm text-muted mt-1">
          Gerencie sessões ao vivo e envie lembretes automáticos por e-mail.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="font-sans text-sm font-semibold text-foreground mb-5">Nova sessão</h2>
            <LiveSessionForm courses={courses} />
          </div>
        </div>
        <div className="lg:col-span-3">
          <LiveSessionList sessions={liveSessions} />
        </div>
      </div>
    </div>
  );
}
