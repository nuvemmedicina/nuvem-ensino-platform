import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Award, Clock, ChevronRight, TrendingUp } from "lucide-react";

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

function calcProgress(
  progress: { completed: boolean }[],
  totalLessons: number
): number {
  if (totalLessons === 0) return 0;
  const done = progress.filter((p) => p.completed).length;
  return Math.round((done / totalLessons) * 100);
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard");
  const { enrollments, certificatesCount } = await getDashboardData(session.user.id);

  const activeEnrollments = enrollments.filter((e) => e.status === "ACTIVE");
  const completedEnrollments = enrollments.filter((e) => e.status === "COMPLETED");

  const totalHours = enrollments.reduce((sum, e) => sum + e.course.hours, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-light text-foreground">
          Olá, {session.user?.name?.split(" ")[0]}!
        </h1>
        <p className="font-sans text-sm text-muted mt-1">
          Bem-vindo de volta à sua área de aprendizado.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          {
            label: "Cursos ativos",
            value: activeEnrollments.length,
            icon: BookOpen,
            color: "text-primary",
          },
          {
            label: "Concluídos",
            value: completedEnrollments.length,
            icon: TrendingUp,
            color: "text-green-600",
          },
          {
            label: "Certificados",
            value: certificatesCount,
            icon: Award,
            color: "text-amber-500",
          },
          {
            label: "Horas de estudo",
            value: totalHours,
            icon: Clock,
            color: "text-primary/70",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3"
          >
            <Icon className={`w-5 h-5 ${color}`} />
            <div>
              <p className="font-serif text-3xl font-semibold text-foreground">{value}</p>
              <p className="font-sans text-xs text-muted mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cursos em andamento */}
      {activeEnrollments.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-xl font-medium text-foreground">Em andamento</h2>
            <Link
              href="/dashboard/cursos"
              className="font-sans text-xs text-primary hover:text-primary-light transition-colors flex items-center gap-1"
            >
              Ver todos <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeEnrollments.slice(0, 4).map((enrollment) => {
              const totalLessons = enrollment.course.modules.reduce(
                (sum, m) => sum + m.lessons.length,
                0
              );
              const pct = calcProgress(enrollment.progress, totalLessons);

              return (
                <Link
                  key={enrollment.id}
                  href={`/dashboard/cursos/${enrollment.course.slug}`}
                  className="flex gap-4 bg-surface border border-border rounded-2xl p-4 hover:border-primary/40 hover:shadow-sm transition-all group"
                >
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
                    <Image
                      src={enrollment.course.instructor.user.image ?? "/instructors/dra-vera.jpg"}
                      alt={enrollment.course.title}
                      fill
                      className="object-cover object-top"
                      sizes="80px"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <p className="font-sans text-[10px] uppercase tracking-wider text-muted">
                        {enrollment.course.instructor.user.name}
                      </p>
                      <h3 className="font-serif text-base font-medium text-foreground leading-snug mt-0.5 line-clamp-2 group-hover:text-primary transition-colors">
                        {enrollment.course.title}
                      </h3>
                    </div>

                    <div className="mt-2">
                      <div className="flex justify-between font-sans text-[10px] text-muted mb-1">
                        <span>Progresso</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="bg-surface border border-border rounded-2xl p-12 text-center">
          <BookOpen className="w-10 h-10 text-muted/40 mx-auto mb-4" />
          <h2 className="font-serif text-xl font-medium text-foreground mb-2">
            Nenhum curso ainda
          </h2>
          <p className="font-sans text-sm text-muted mb-6">
            Explore nosso catálogo e comece sua formação.
          </p>
          <Link
            href="/cursos"
            className="inline-block font-sans text-sm font-semibold px-6 py-3 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            Ver Cursos
          </Link>
        </section>
      )}
    </div>
  );
}
