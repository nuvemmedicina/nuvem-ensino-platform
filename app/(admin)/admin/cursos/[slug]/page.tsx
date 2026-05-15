import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, CheckCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  updateCourse,
  updateLesson,
  createModule,
  createLesson,
  deleteLesson,
  deleteModule,
} from "./actions";
import { DeleteButton } from "./DeleteButton";
import { MuxUploader } from "./MuxUploader";

type Props = { params: Promise<{ slug: string }> };

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50";
const labelClass = "block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5";
const btnPrimary =
  "font-sans text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors";
const btnGhost =
  "font-sans text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-muted hover:border-primary/40 hover:text-foreground transition-colors";
const btnDanger =
  "font-sans text-xs px-2 py-1.5 rounded-lg text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-colors";

export default async function AdminCursoEditPage({ params }: Props) {
  const { slug } = await params;

  const course = await prisma.course.findFirst({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!course) notFound();

  const updateCourseAction = updateCourse.bind(null, course.id, slug);

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <Link
        href="/admin/cursos"
        className="inline-flex items-center gap-1.5 font-sans text-sm text-muted hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Cursos
      </Link>

      <h1 className="font-serif text-2xl font-medium text-foreground mb-8 line-clamp-2">
        {course.title}
      </h1>

      {/* ── Dados do curso ── */}
      <section className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-5">
          Dados do Curso
        </h2>
        <form action={updateCourseAction} className="space-y-4">
          <div>
            <label className={labelClass}>Título</label>
            <input name="title" defaultValue={course.title} required className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Descrição curta</label>
            <input name="shortDesc" defaultValue={course.shortDesc ?? ""} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Descrição completa</label>
            <textarea
              name="description"
              defaultValue={course.description}
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Preço (R$)</label>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={Number(course.price)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Carga horária (h)</label>
              <input
                name="hours"
                type="number"
                min="1"
                defaultValue={course.hours}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Status</label>
              <select name="status" defaultValue={course.status} className={inputClass}>
                <option value="DRAFT">Rascunho</option>
                <option value="PUBLISHED">Publicado</option>
                <option value="ARCHIVED">Arquivado</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Categoria</label>
              <select name="category" defaultValue={course.category} className={inputClass}>
                <option value="ONLINE">Online</option>
                <option value="HANDS_ON">Hands-On</option>
                <option value="HYBRID">Híbrido</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Local (presencial)</label>
            <input name="location" defaultValue={course.location ?? ""} placeholder="Ex: NU.V.E.M Medicina · Belo Horizonte" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>URL da miniatura</label>
            <input name="thumbnailUrl" defaultValue={course.thumbnailUrl ?? ""} placeholder="https://..." className={inputClass} />
          </div>

          <div className="pt-2">
            <button type="submit" className={btnPrimary}>Salvar dados do curso</button>
          </div>
        </form>
      </section>

      {/* ── Módulos & Aulas ── */}
      <section className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-5">
          Módulos & Aulas
        </h2>

        <div className="flex flex-col gap-6">
          {course.modules.map((mod) => {
            const deleteModAction = deleteModule.bind(null, mod.id, slug);
            const createLessonAction = createLesson.bind(null, mod.id, slug);

            return (
              <div key={mod.id} className="border border-border rounded-xl overflow-hidden">
                {/* Module header */}
                <div className="flex items-center justify-between px-4 py-3 bg-background border-b border-border">
                  <span className="font-sans text-sm font-semibold text-foreground">{mod.title}</span>
                  <DeleteButton
                    action={deleteModAction}
                    confirm={`Excluir módulo "${mod.title}" e todas as suas aulas?`}
                    className={btnDanger}
                  />
                </div>

                {/* Lessons */}
                <div className="divide-y divide-border">
                  {mod.lessons.map((lesson) => {
                    const updateLessonAction = updateLesson.bind(null, lesson.id, slug);
                    const deleteLessonAction = deleteLesson.bind(null, lesson.id, slug);

                    return (
                      <div key={lesson.id} className="px-4 py-4">
                        <div className="flex items-start gap-3 mb-3">
                          <form action={updateLessonAction} className="flex-1 space-y-3">
                            <div className="space-y-2">
                              <input
                                name="title"
                                defaultValue={lesson.title}
                                placeholder="Título da aula"
                                className={inputClass}
                              />
                              <input
                                name="videoUrl"
                                defaultValue={lesson.videoUrl ?? ""}
                                placeholder="URL do YouTube (opcional — use se não tiver vídeo Mux)"
                                className={inputClass}
                              />
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 w-28">
                                <input
                                  name="duration"
                                  type="number"
                                  min="0"
                                  defaultValue={lesson.duration ?? ""}
                                  placeholder="Duração"
                                  className={`${inputClass} text-xs`}
                                />
                                <span className="font-sans text-xs text-muted shrink-0">min</span>
                              </div>
                              <label className="flex items-center gap-2 font-sans text-xs text-muted cursor-pointer">
                                <input
                                  type="checkbox"
                                  name="isFree"
                                  defaultChecked={lesson.isFree}
                                  className="accent-primary"
                                />
                                Aula gratuita
                              </label>
                              <button type="submit" className={btnGhost}>Salvar</button>
                            </div>
                          </form>

                          <DeleteButton
                            action={deleteLessonAction}
                            confirm={`Excluir aula "${lesson.title}"?`}
                            className={`${btnDanger} shrink-0 mt-1`}
                          />
                        </div>

                        {/* Mux video section */}
                        <div className="mt-1 pt-3 border-t border-border/50">
                          {lesson.muxPlaybackId ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="w-4 h-4 shrink-0" />
                              <span className="font-sans text-xs font-semibold">
                                Vídeo Mux ativo
                              </span>
                              <span className="font-sans text-[10px] text-muted font-mono">
                                {lesson.muxPlaybackId.slice(0, 12)}…
                              </span>
                            </div>
                          ) : lesson.muxAssetId ? (
                            <div className="flex items-center gap-2 text-amber-600">
                              <span className="font-sans text-xs">
                                ⏳ Processando no Mux… aguarde o webhook
                              </span>
                            </div>
                          ) : (
                            <MuxUploader lessonId={lesson.id} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add lesson */}
                <div className="px-4 py-3 bg-background/50 border-t border-border">
                  <form action={createLessonAction} className="flex gap-2">
                    <input
                      name="title"
                      placeholder="Título da nova aula"
                      required
                      className={`${inputClass} flex-1 text-xs`}
                    />
                    <input
                      name="videoUrl"
                      placeholder="URL YouTube (opcional)"
                      className={`${inputClass} flex-1 text-xs`}
                    />
                    <button type="submit" className={btnGhost}>
                      <Plus className="w-3.5 h-3.5 inline mr-1" />
                      Adicionar
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add module */}
        <div className="mt-5 pt-5 border-t border-border">
          <p className="font-sans text-xs font-semibold text-muted mb-3">Adicionar módulo</p>
          <form action={createModule.bind(null, course.id, slug)} className="flex gap-2">
            <input
              name="title"
              placeholder="Título do novo módulo"
              required
              className={`${inputClass} flex-1`}
            />
            <button type="submit" className={btnPrimary}>
              <Plus className="w-4 h-4 inline mr-1" />
              Criar
            </button>
          </form>
        </div>
      </section>

      {/* Link para ver o curso público */}
      <div className="flex gap-3">
        <Link
          href={`/cursos/${slug}`}
          target="_blank"
          className={btnGhost}
        >
          Ver página pública ↗
        </Link>
        <Link
          href={`/dashboard/cursos/${slug}`}
          target="_blank"
          className={btnGhost}
        >
          Ver player ↗
        </Link>
      </div>
    </div>
  );
}
