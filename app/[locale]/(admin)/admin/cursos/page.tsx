import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { DeleteButton } from "./[slug]/DeleteButton";
import { deleteCourse } from "./[slug]/actions";

export default async function AdminCursosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.courses" });

  const statusColors: Record<string, string> = {
    PUBLISHED: "text-green-600 bg-green-500/10 border-green-500/20",
    DRAFT:     "text-amber-600 bg-amber-500/10 border-amber-500/20",
    ARCHIVED:  "text-muted bg-border/50 border-border",
  };

  const courses = await prisma.course.findMany({
    include: {
      instructor: { include: { user: { select: { name: true } } } },
      modules: { include: { lessons: { select: { id: true } } } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-light text-foreground">{t("title")}</h1>
          <p className="font-sans text-sm text-muted mt-1">{t("count", { count: courses.length })}</p>
        </div>
        <Link
          href="/admin/cursos/novo"
          className="inline-flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("newCourse")}
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {courses.map((course) => {
          const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
          const statusKey = course.status === "PUBLISHED" ? "statusPublished" : course.status === "ARCHIVED" ? "statusArchived" : "statusDraft";
          const statusColor = statusColors[course.status] ?? statusColors.DRAFT;
          const deleteAction = deleteCourse.bind(null, course.id);
          const hasEnrollments = course._count.enrollments > 0;

          return (
            <div
              key={course.id}
              className="flex items-center gap-2 bg-surface border border-border rounded-2xl hover:border-primary/40 hover:shadow-sm transition-all group"
            >
              {/* Área clicável → editar curso */}
              <Link
                href={`/admin/cursos/${course.slug}`}
                className="flex flex-1 items-center justify-between gap-4 px-6 py-4 min-w-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className={`font-sans text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor}`}>
                      {t(statusKey)}
                    </span>
                    <span className="font-sans text-[10px] text-muted uppercase tracking-wider">
                      {course.instructor.user.name}
                    </span>
                  </div>
                  <h2 className="font-serif text-base font-medium text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
                    {course.title}
                  </h2>
                </div>

                <div className="flex items-center gap-6 shrink-0 text-right">
                  <div className="hidden sm:block">
                    <p className="font-sans text-xs text-muted">{t("lessons")}</p>
                    <p className="font-sans text-sm font-semibold text-foreground">{totalLessons}</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="font-sans text-xs text-muted">{t("enrollments")}</p>
                    <p className="font-sans text-sm font-semibold text-foreground">{course._count.enrollments}</p>
                  </div>
                  {course.totalSeats !== null && (
                    <div className="hidden sm:block">
                      <p className="font-sans text-xs text-muted">{t("seats")}</p>
                      <p className="font-sans text-sm font-semibold text-foreground">
                        {course.totalSeats - course.reservedSeats}
                        <span className="text-muted font-normal">/{course.totalSeats}</span>
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="font-sans text-xs text-muted">{t("price")}</p>
                    <p className="font-serif text-sm font-semibold text-primary">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(course.price))}
                    </p>
                  </div>
                </div>
              </Link>

              {/* Botão excluir — separado do Link para não conflitar com navegação */}
              <div className="pr-4 shrink-0">
                <DeleteButton
                  action={deleteAction}
                  confirm={
                    hasEnrollments
                      ? `⚠️ "${course.title}" tem ${course._count.enrollments} matrícula(s). Excluir removerá TODOS os dados do curso permanentemente. Confirma?`
                      : `Excluir o curso "${course.title}"? Esta ação não pode ser desfeita.`
                  }
                  className="p-2 rounded-lg text-muted/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
