import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Plus, PlayCircle, Settings } from "lucide-react";
import { createCourse } from "./actions";

export default async function InstructorCursosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/instrutor/cursos");

  const instructor = await prisma.instructor.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!instructor) redirect("/dashboard");

  const statusLabels: Record<string, string> = {
    PUBLISHED: "Publicado",
    DRAFT: "Rascunho",
    ARCHIVED: "Arquivado",
  };

  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { instructorId: instructor.id },
        { modules: { some: { instructors: { some: { instructorId: instructor.id } } } } },
      ],
    },
    include: {
      modules: { include: { lessons: { select: { id: true } } } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-light text-foreground">Meus Cursos</h1>
          <p className="font-sans text-sm text-muted mt-1">
            {courses.length} {courses.length === 1 ? "curso" : "cursos"}
          </p>
        </div>
        <form action={createCourse} className="flex items-center gap-2">
          <input
            name="title"
            required
            placeholder="Título do novo curso"
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50 w-52"
          />
          <select
            name="category"
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/50"
          >
            <option value="ONLINE">Online</option>
            <option value="HANDS_ON">Hands-On</option>
            <option value="HYBRID">Híbrido</option>
          </select>
          <button
            type="submit"
            className="flex items-center gap-1.5 font-sans text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Criar curso
          </button>
        </form>
      </div>

      {courses.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center">
          <p className="font-sans text-sm text-muted">
            Nenhum curso atribuído a você ainda. Entre em contato com o administrador.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          {courses.map((course) => {
            const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);

            return (
              <div key={course.id} className="group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/15 bg-surface">
                {/* Poster */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#0e4f6b] to-[#1a8fa8]" style={{ paddingBottom: "140%" }}>
                  {course.thumbnailUrl && (
                    <Image
                      src={course.thumbnailUrl}
                      alt={course.title}
                      fill
                      className="absolute inset-0 object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 33vw, 20vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  {/* Badge status */}
                  <span className={`absolute top-3 left-3 font-sans text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                    course.status === "PUBLISHED" ? "bg-green-500 text-white" :
                    course.status === "DRAFT"     ? "bg-amber-400 text-amber-900" :
                                                    "bg-white/20 text-white"
                  }`}>
                    {statusLabels[course.status] ?? course.status}
                  </span>

                  {/* Info sobreposta */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-sans text-[9px] font-bold uppercase tracking-widest text-white/50">
                        {totalLessons} aulas
                      </span>
                      <span className="text-white/30">·</span>
                      <span className="font-sans text-[9px] font-bold uppercase tracking-widest text-white/50">
                        {course._count.enrollments} alunos
                      </span>
                    </div>
                    <p className="font-sans text-sm font-bold text-white leading-snug line-clamp-2">
                      {course.title}
                    </p>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex flex-col gap-1.5 p-2.5">
                  <Link
                    href={`/dashboard/cursos/${course.slug}`}
                    target="_blank"
                    className="w-full flex items-center justify-center gap-1.5 font-sans text-[11px] font-bold px-3 py-2 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors"
                  >
                    <PlayCircle className="w-3.5 h-3.5" /> Assistir
                  </Link>
                  <Link
                    href={`/instrutor/cursos/${course.slug}`}
                    className="w-full flex items-center justify-center gap-1.5 font-sans text-[11px] font-semibold px-3 py-2 rounded-xl border border-border text-muted hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    <Settings className="w-3 h-3" /> Gerenciar
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
