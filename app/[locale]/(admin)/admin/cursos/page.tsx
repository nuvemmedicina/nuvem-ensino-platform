import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";

const statusLabel: Record<string, { label: string; color: string }> = {
  PUBLISHED: { label: "Publicado", color: "text-green-600 bg-green-500/10 border-green-500/20" },
  DRAFT:     { label: "Rascunho",  color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
  ARCHIVED:  { label: "Arquivado", color: "text-muted bg-border/50 border-border" },
};

export default async function AdminCursosPage() {
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
          <h1 className="font-serif text-3xl font-light text-foreground">Cursos</h1>
          <p className="font-sans text-sm text-muted mt-1">{courses.length} cursos cadastrados</p>
        </div>
        <Link
          href="/admin/cursos/novo"
          className="inline-flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Curso
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {courses.map((course) => {
          const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
          const st = statusLabel[course.status] ?? statusLabel.DRAFT;

          return (
            <Link
              key={course.id}
              href={`/admin/cursos/${course.slug}`}
              className="flex items-center justify-between gap-4 bg-surface border border-border rounded-2xl px-6 py-4 hover:border-primary/40 hover:shadow-sm transition-all group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span className={`font-sans text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${st.color}`}>
                    {st.label}
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
                  <p className="font-sans text-xs text-muted">Aulas</p>
                  <p className="font-sans text-sm font-semibold text-foreground">{totalLessons}</p>
                </div>
                <div className="hidden sm:block">
                  <p className="font-sans text-xs text-muted">Matrículas</p>
                  <p className="font-sans text-sm font-semibold text-foreground">{course._count.enrollments}</p>
                </div>
                <div>
                  <p className="font-sans text-xs text-muted">Preço</p>
                  <p className="font-serif text-sm font-semibold text-primary">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(course.price))}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
