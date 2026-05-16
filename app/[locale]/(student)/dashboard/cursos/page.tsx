import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

function calcProgress(progress: { completed: boolean }[], totalLessons: number) {
  if (totalLessons === 0) return 0;
  return Math.round((progress.filter((p) => p.completed).length / totalLessons) * 100);
}

export default async function MeusCursosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.courses" });

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard/cursos");

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id, status: { in: ["ACTIVE", "COMPLETED"] } },
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
  });

  const subtitle =
    enrollments.length === 0
      ? t("notEnrolled")
      : enrollments.length === 1
      ? t("countOne")
      : t("countPlural", { count: enrollments.length });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-medium text-foreground">{t("title")}</h1>
        <p className="font-sans text-sm text-muted mt-1">{subtitle}</p>
      </div>

      {enrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-surface border border-border rounded-2xl">
          <BookOpen className="w-12 h-12 text-muted/30 mb-4" />
          <p className="font-serif text-xl text-foreground/40 mb-2">{t("emptyTitle")}</p>
          <p className="font-sans text-sm text-muted mb-6">{t("emptyDesc")}</p>
          <Link
            href="/cursos"
            className="inline-block font-sans text-sm font-semibold px-6 py-3 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            {t("viewCourses")}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {enrollments.map((enrollment) => {
            const totalLessons = enrollment.course.modules.reduce(
              (sum, m) => sum + m.lessons.length,
              0
            );
            const pct = calcProgress(enrollment.progress, totalLessons);
            const completed = enrollment.status === "COMPLETED";

            return (
              <Link
                key={enrollment.id}
                href={`/dashboard/cursos/${enrollment.course.slug}`}
                className="flex gap-5 bg-surface border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-sm transition-all group"
              >
                <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0">
                  <Image
                    src={
                      enrollment.course.instructor.user.image ??
                      "/instructors/dra-vera.jpg"
                    }
                    alt={enrollment.course.title}
                    fill
                    className="object-cover object-top"
                    sizes="96px"
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <p className="font-sans text-[10px] uppercase tracking-wider text-muted">
                      {enrollment.course.instructor.user.name}
                    </p>
                    <h2 className="font-serif text-base font-medium text-foreground leading-snug mt-0.5 line-clamp-2 group-hover:text-primary transition-colors">
                      {enrollment.course.title}
                    </h2>
                    <p className="font-sans text-xs text-muted mt-1">
                      {enrollment.course.hours}h · {totalLessons} {t("lessons")}
                    </p>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between font-sans text-[10px] text-muted mb-1">
                      <span>{completed ? t("completedLabel") : t("progressLabel")}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${completed ? "bg-green-500" : "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted/40 shrink-0 self-center group-hover:text-primary transition-colors" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
