import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Pencil, Copy, Trash2, Users, BookOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { DeleteButton } from "./[slug]/DeleteButton";
import { DuplicateButton } from "./[slug]/DuplicateButton";
import { deleteCourse, duplicateCourse } from "./[slug]/actions";

export default async function AdminCursosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.courses" });

  const statusLabel: Record<string, string> = {
    PUBLISHED: "Disponível",
    DRAFT:     "Rascunho",
    ARCHIVED:  "Arquivado",
  };
  const statusColors: Record<string, string> = {
    PUBLISHED: "bg-green-500/90 text-white",
    DRAFT:     "bg-amber-500/90 text-white",
    ARCHIVED:  "bg-zinc-600/90 text-white",
  };

  const courses = await prisma.course.findMany({
    include: {
      instructor: { include: { user: { select: { name: true } } } },
      modules: { include: { topics: { include: { lessons: { select: { id: true } } } } } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      {/* Header */}
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

      {/* Grid Netflix */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {courses.map((course) => {
          const totalLessons = course.modules.reduce(
            (s, m) => s + m.topics.reduce((ts, t) => ts + t.lessons.length, 0),
            0,
          );
          const deleteAction = deleteCourse.bind(null, course.id);
          const duplicateAction = duplicateCourse.bind(null, course.id);
          const hasEnrollments = course._count.enrollments > 0;
          const statusCls = statusColors[course.status] ?? statusColors.DRAFT;
          const label = statusLabel[course.status] ?? course.status;

          return (
            <div key={course.id} className="group relative flex flex-col rounded-xl overflow-hidden border border-border bg-surface hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">

              {/* Thumbnail */}
              <div className="relative aspect-[2/3] bg-gradient-to-b from-zinc-800 to-zinc-900 shrink-0 overflow-hidden">
                {course.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <BookOpen className="w-12 h-12 text-white" />
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                {/* Status badge */}
                <span className={`absolute top-2.5 left-2.5 font-sans text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusCls}`}>
                  {label}
                </span>

                {/* Hover actions overlay */}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/admin/cursos/${course.slug}`}
                    className="flex items-center gap-1.5 font-sans text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white text-zinc-900 hover:bg-white/90 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    Editar
                  </Link>
                  <Link
                    href={`/dashboard/cursos/${course.slug}`}
                    target="_blank"
                    className="flex items-center gap-1.5 font-sans text-[11px] font-bold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
                  >
                    Ver
                  </Link>
                </div>

                {/* Bottom info on thumbnail */}
                <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                  <p className="font-sans text-[10px] text-white/60 truncate">{course.instructor.user.name}</p>
                </div>
              </div>

              {/* Card body */}
              <div className="flex flex-col gap-2 px-3 py-2.5 flex-1">
                <Link href={`/admin/cursos/${course.slug}`} className="block">
                  <h2 className="font-serif text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h2>
                </Link>

                {/* Stats row */}
                <div className="flex items-center gap-3 mt-auto">
                  <span className="inline-flex items-center gap-1 font-sans text-[11px] text-muted">
                    <BookOpen className="w-3 h-3" />
                    {totalLessons}
                  </span>
                  <span className="inline-flex items-center gap-1 font-sans text-[11px] text-muted">
                    <Users className="w-3 h-3" />
                    {course._count.enrollments}
                  </span>
                  <span className="font-sans text-[11px] font-semibold text-primary ml-auto">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(course.price))}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 border-t border-border/50 pt-2 -mx-3 px-3">
                  <DuplicateButton
                    action={duplicateAction}
                    className="p-1.5 rounded-md text-muted/50 hover:text-accent hover:bg-accent/10 transition-colors"
                  />
                  <DeleteButton
                    action={deleteAction}
                    confirm={
                      hasEnrollments
                        ? `⚠️ "${course.title}" tem ${course._count.enrollments} matrícula(s). Excluir removerá TODOS os dados permanentemente. Confirma?`
                        : `Excluir o curso "${course.title}"? Esta ação não pode ser desfeita.`
                    }
                    className="p-1.5 rounded-md text-muted/50 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
