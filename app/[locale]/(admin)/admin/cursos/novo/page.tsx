import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createCourse } from "./actions";
import { ImageUploader } from "@/components/ImageUploader";

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50";
const labelClass =
  "block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5";
const btnPrimary =
  "font-sans text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors";

export default async function NovoCursoPage() {
  const instructors = await prisma.instructor.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });

  if (instructors.length === 0) notFound();

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/cursos"
        className="inline-flex items-center gap-1.5 font-sans text-sm text-muted hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Cursos
      </Link>

      <h1 className="font-serif text-2xl font-medium text-foreground mb-8">
        Novo Curso
      </h1>

      <section className="bg-surface border border-border rounded-2xl p-6">
        <form action={createCourse} className="space-y-4">
          <div>
            <label className={labelClass}>Título *</label>
            <input name="title" required autoFocus className={inputClass} placeholder="Ex: Manometria Esofágica Avançada" />
          </div>

          <div>
            <label className={labelClass}>Descrição</label>
            <textarea
              name="description"
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Descrição completa do curso"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Preço (R$)</label>
              <input name="price" type="number" step="0.01" min="0" defaultValue="0" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Carga horária (h)</label>
              <input name="hours" type="number" min="1" defaultValue="1" required className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Categoria</label>
              <select name="category" className={inputClass}>
                <option value="ONLINE">Online</option>
                <option value="HANDS_ON">Hands-On</option>
                <option value="HYBRID">Híbrido</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Instrutor *</label>
              <select name="instructorId" required className={inputClass}>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Link do conteúdo online (opcional)</label>
            <input
              name="contentUrl"
              type="url"
              className={inputClass}
              placeholder="https://youtube.com/watch?v=... ou link da plataforma"
            />
            <p className="font-sans text-[11px] text-muted/60 mt-1">
              Para cursos online — link da aula, playlist ou plataforma externa.
            </p>
          </div>

          <div>
            <label className={labelClass}>Imagem de capa (opcional)</label>
            <ImageUploader
              name="thumbnailUrl"
              folder="courses"
              aspectHint="16:9"
              label="Imagem de capa"
            />
          </div>

          <p className="font-sans text-xs text-muted pt-1">
            O curso será criado como <strong>Rascunho</strong>. Você pode editar todos os detalhes na próxima tela.
          </p>

          <div className="pt-2">
            <button type="submit" className={btnPrimary}>
              Criar curso →
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
