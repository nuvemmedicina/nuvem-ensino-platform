import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BarChart2, BookOpen, ExternalLink, Eye, Pencil, Plus, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { DeleteButton } from "./[slug]/DeleteButton";
import { DuplicateButton } from "./[slug]/DuplicateButton";
import { deleteCourse, duplicateCourse } from "./[slug]/actions";

/**
 * Lista de cursos do painel. Era uma grade de cartazes do mesmo tamanho para
 * todos, com arquivados misturados aos disponíveis; agora é uma lista por
 * situação, com os números que a coordenação consulta (alunos ativos, aulas,
 * preço, datas) e as ações de cada curso à mão.
 */

const SITUACOES = [
  { status: "PUBLISHED", titulo: "Disponíveis", selo: "bg-green-100 text-green-800" },
  { status: "DRAFT", titulo: "Rascunhos", selo: "bg-amber-100 text-amber-900" },
  { status: "ARCHIVED", titulo: "Arquivados", selo: "bg-zinc-200 text-zinc-700" },
] as const;

const MODALIDADE: Record<string, string> = { ONLINE: "Online", HANDS_ON: "Hands-on", HYBRID: "Híbrido" };

export default async function AdminCursosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.courses" });

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      category: true,
      hours: true,
      price: true,
      salePrice: true,
      thumbnailUrl: true,
      startDateLabel: true,
      contentUrl: true,
      instructor: { select: { user: { select: { name: true } } } },
      modules: { select: { topics: { select: { _count: { select: { lessons: true } } } } } },
      _count: {
        select: {
          enrollments: { where: { status: { in: ["ACTIVE", "COMPLETED"] } } },
          modules: true,
        },
      },
    },
  });

  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-light text-foreground">{t("title")}</h1>
          <p className="font-sans text-sm text-muted mt-1">
            {SITUACOES.map((s) => `${courses.filter((c) => c.status === s.status).length} ${s.titulo.toLowerCase()}`).join(" · ")}
          </p>
        </div>
        <Link
          href="/admin/cursos/novo"
          className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-primary text-white font-sans text-sm font-semibold hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          {t("newCourse")}
        </Link>
      </div>

      <div className="flex flex-col gap-10">
        {SITUACOES.map((situacao) => {
          const lista = courses.filter((c) => c.status === situacao.status);
          if (lista.length === 0) return null;

          const tabela = (
            <ul className="bg-surface border border-border rounded-2xl divide-y divide-border">
              {lista.map((course) => {
                const aulas = course.modules.reduce((s, m) => s + m.topics.reduce((ts, tp) => ts + tp._count.lessons, 0), 0);
                const alunos = course._count.enrollments;
                const preco = course.salePrice ?? course.price;
                return (
                  <li key={course.id} className="flex flex-wrap items-center gap-4 px-4 sm:px-5 py-4">
                    <Link href={`/admin/cursos/${course.slug}`} className="relative w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-canvas" tabIndex={-1} aria-hidden="true">
                      {course.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={course.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="absolute inset-0 m-auto w-5 h-5 text-white/40" />
                      )}
                    </Link>

                    <div className="flex-1 min-w-[min(100%,18rem)] flex flex-col gap-1">
                      <Link href={`/admin/cursos/${course.slug}`} className="font-sans text-[15px] font-semibold text-foreground leading-snug hover:text-primary">
                        {course.title}
                      </Link>
                      <p className="font-sans text-sm text-muted">
                        {[
                          course.instructor.user.name,
                          MODALIDADE[course.category] ?? null,
                          course.hours ? `${course.hours}h` : null,
                          course.startDateLabel,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <p className="flex flex-wrap gap-x-4 gap-y-1 font-sans text-sm text-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-muted" aria-hidden="true" />
                          {alunos} {alunos === 1 ? "aluno ativo" : "alunos ativos"}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-muted" aria-hidden="true" />
                          {course.contentUrl && aulas === 0
                            ? "link externo"
                            : `${course._count.modules} ${course._count.modules === 1 ? "módulo" : "módulos"} · ${aulas} ${aulas === 1 ? "aula" : "aulas"}`}
                        </span>
                        <span className="font-semibold text-primary tabular-nums">{brl.format(Number(preco))}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                      <Link
                        href={`/admin/cursos/${course.slug}`}
                        className="inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-full bg-primary text-white font-sans text-sm font-semibold hover:bg-primary/90"
                      >
                        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        Editar
                      </Link>
                      <Link
                        href={`/admin/cursos/${course.slug}/inscritos`}
                        className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-full border border-border font-sans text-sm text-foreground hover:border-primary/40"
                      >
                        <Users className="w-3.5 h-3.5" aria-hidden="true" />
                        Inscritos
                      </Link>
                      <Link
                        href={`/admin/cursos/${course.slug}/relatorio`}
                        className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-full border border-border font-sans text-sm text-foreground hover:border-primary/40"
                      >
                        <BarChart2 className="w-3.5 h-3.5" aria-hidden="true" />
                        Provas
                      </Link>
                      <Link
                        href={`/dashboard/cursos/${course.slug}`}
                        target="_blank"
                        aria-label={`Ver "${course.title}" como aluno`}
                        title="Ver como aluno"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full text-muted hover:text-primary hover:bg-primary/10"
                      >
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      </Link>
                      <Link
                        href={`/cursos/${course.slug}`}
                        target="_blank"
                        aria-label={`Abrir a página pública de "${course.title}"`}
                        title="Página pública"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full text-muted hover:text-primary hover:bg-primary/10"
                      >
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      </Link>
                      <DuplicateButton
                        action={duplicateCourse.bind(null, course.id)}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full text-muted hover:text-primary hover:bg-primary/10"
                      />
                      <DeleteButton
                        rotulo={`Excluir "${course.title}"`}
                        action={deleteCourse.bind(null, course.id)}
                        confirm={
                          alunos > 0
                            ? `⚠️ "${course.title}" tem ${alunos} aluno(s) ativo(s). Excluir removerá TODOS os dados permanentemente. Confirma?`
                            : `Excluir o curso "${course.title}"? Esta ação não pode ser desfeita.`
                        }
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full text-muted hover:text-red-700 hover:bg-red-50"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          );

          return (
            <section key={situacao.status} aria-labelledby={`situacao-${situacao.status}`} className="flex flex-col gap-3">
              {situacao.status === "ARCHIVED" ? (
                <details className="group">
                  <summary className="list-none cursor-pointer flex items-center gap-3 mb-3 [&::-webkit-details-marker]:hidden">
                    <h2 id={`situacao-${situacao.status}`} className="font-sans text-lg font-semibold text-foreground">
                      {situacao.titulo}
                    </h2>
                    <span className={`font-sans text-xs font-semibold px-2.5 py-0.5 rounded-full ${situacao.selo}`}>{lista.length}</span>
                    <span className="font-sans text-sm text-primary group-open:hidden">mostrar</span>
                    <span className="font-sans text-sm text-primary hidden group-open:inline">esconder</span>
                  </summary>
                  {tabela}
                </details>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <h2 id={`situacao-${situacao.status}`} className="font-sans text-lg font-semibold text-foreground">
                      {situacao.titulo}
                    </h2>
                    <span className={`font-sans text-xs font-semibold px-2.5 py-0.5 rounded-full ${situacao.selo}`}>{lista.length}</span>
                  </div>
                  {tabela}
                </>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
