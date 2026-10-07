export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Users, BarChart2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  updateCourse,
  updateCourseContent,
  updateCourseTranslations,
  updateCourseCoInstructor,
} from "./actions";
import { FaqEditor } from "./FaqEditor";
import { ImageUploader } from "@/components/ImageUploader";
import { ReferencesManager } from "./ReferencesManager";
import { ConteudoCurso } from "./ConteudoCurso";
import { ProvasCurso } from "./ProvasCurso";
import { TraducoesConteudo } from "./TraducoesConteudo";

type Props = {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ aba?: string; item?: string; modulo?: string; questao?: string; q?: string }>;
};

// Abas da página de edição. Só a aba aberta é montada: com tudo numa página,
// o DICI chegava a 23 telas de rolagem e mais de 5.700 campos de formulário,
// e cada "Salvar" remontava tudo.
const ABAS = [
  { id: "informacoes", rotulo: "Informações" },
  { id: "venda", rotulo: "Página de venda" },
  { id: "conteudo", rotulo: "Conteúdo" },
  { id: "provas", rotulo: "Provas" },
  { id: "materiais", rotulo: "Materiais" },
  { id: "traducoes", rotulo: "Traduções" },
] as const;
type Aba = (typeof ABAS)[number]["id"];

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50";
const labelClass = "block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5";
const btnPrimary =
  "font-sans text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors";
const btnGhost =
  "font-sans text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-muted hover:border-primary/40 hover:text-foreground transition-colors";

export default async function AdminCursoEditPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { aba: abaPedida, item, modulo, questao, q } = await searchParams;
  const aba: Aba = ABAS.some((a) => a.id === abaPedida) ? (abaPedida as Aba) : "informacoes";

  const [courseRaw, courseReferences] = await Promise.all([
    prisma.course.findFirst({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          topics: {
            orderBy: { order: "asc" },
            include: {
              lessons: {
                orderBy: { order: "asc" },
                include: {
                  quiz: {
                    include: {
                      questions: {
                        include: { options: true },
                        orderBy: { order: "asc" },
                      },
                    },
                  },
                  instructors: { include: { instructor: { include: { user: true } } }, orderBy: { order: "asc" } },
                },
              },
            },
          },
          instructors: { include: { instructor: { include: { user: true } } }, orderBy: { order: "asc" } },
          quiz: {
            include: {
              questions: {
                include: { options: { orderBy: { order: "asc" } } },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
    },
  }),
    prisma.courseReference.findMany({
      where: { course: { slug } },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  const course = courseRaw;

  if (!course) notFound();

  const allInstructors = await prisma.instructor.findMany({
    include: { user: true },
    orderBy: { displayOrder: "asc" },
  });

  // Quantas tentativas já receberam a questão aberta (aviso antes de mexer no gabarito)
  const vezesSorteada =
    aba === "provas" && questao
      ? await prisma.moduleQuizAttempt.count({ where: { servedQuestionIds: { has: questao } } })
      : 0;

  const updateCourseAction = updateCourse.bind(null, course.id, slug);
  const updateCourseContentAction = updateCourseContent.bind(null, course.id, slug);
  const updateCourseTranslationsAction = updateCourseTranslations.bind(null, course.id, slug);
  const updateCourseCoInstructorAction = updateCourseCoInstructor.bind(null, course.id, slug);

  return (
    <div className={aba === "conteudo" || aba === "provas" ? "max-w-6xl" : "max-w-3xl"}>
      {/* Breadcrumb */}
      <Link
        href="/admin/cursos"
        className="inline-flex items-center gap-1.5 font-sans text-sm text-muted hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Cursos
      </Link>

      <div className="flex items-start justify-between gap-4 mb-8">
        <h1 className="font-serif text-2xl font-medium text-foreground line-clamp-2">
          {course.title}
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/admin/cursos/${slug}/relatorio`}
            className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold px-3 py-2 rounded-lg border border-border text-muted hover:border-primary/40 hover:text-foreground transition-colors"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Relatório de provas
          </Link>
          <Link
            href={`/admin/cursos/${slug}/inscritos`}
            className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold px-3 py-2 rounded-lg border border-border text-muted hover:border-primary/40 hover:text-foreground transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            Ver inscritos
          </Link>
        </div>
      </div>

      <nav aria-label="Seções do curso" className="flex flex-wrap gap-1 border-b border-border mb-6 -mt-2">
        {ABAS.map((a) => (
          <Link
            key={a.id}
            href={`/admin/cursos/${slug}?aba=${a.id}`}
            scroll={false}
            aria-current={aba === a.id ? "page" : undefined}
            className={`font-sans text-sm px-4 py-2.5 -mb-px border-b-2 transition-colors ${
              aba === a.id ? "border-primary text-primary font-semibold" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {a.rotulo}
          </Link>
        ))}
      </nav>

      {/* ── Dados do curso ── */}
      {aba === "informacoes" && (
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
            <label className={labelClass}>Link (slug)</label>
            <div className="flex items-center gap-0">
              <span className="font-sans text-xs text-muted bg-border/40 border border-r-0 border-border rounded-l-lg px-3 py-2 whitespace-nowrap select-none">
                nuvemensino.com.br/cursos/
              </span>
              <input
                name="slug"
                defaultValue={course.slug}
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                title="Apenas letras minúsculas, números e hífens"
                className={`${inputClass} rounded-l-none`}
              />
            </div>
            <p className="font-sans text-[10px] text-muted mt-1">Apenas letras minúsculas, números e hífens. Alterar invalida links existentes.</p>
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
            <label className={labelClass}>Vagas totais</label>
            <input
              name="totalSeats"
              type="number"
              min="1"
              defaultValue={course.totalSeats ?? ""}
              placeholder="Deixe em branco = ilimitado"
              className={inputClass}
            />
            <p className="font-sans text-[10px] text-muted mt-1">
              Reservadas: <strong>{course.reservedSeats}</strong>
              {course.totalSeats !== null && (
                <> · Disponíveis: <strong>{course.totalSeats - course.reservedSeats}</strong></>
              )}
            </p>
          </div>

          <div>
            <label className={labelClass}>Link do conteúdo online (opcional)</label>
            <input
              name="contentUrl"
              type="url"
              defaultValue={course.contentUrl ?? ""}
              placeholder="https://youtube.com/watch?v=... ou link da plataforma"
              className={inputClass}
            />
            <p className="font-sans text-[11px] text-muted/60 mt-1">
              Para cursos online — link da aula, playlist ou plataforma externa.
            </p>
          </div>

          <div>
            <label className={labelClass}>Link de compra externo (opcional)</label>
            <input
              name="externalCheckoutUrl"
              type="url"
              defaultValue={course.externalCheckoutUrl ?? ""}
              placeholder="https://parceiro.com.br/produto/..."
              className={inputClass}
            />
            <p className="font-sans text-[11px] text-muted/60 mt-1">
              Quando preenchido, o botão &ldquo;Matricular-se&rdquo; redireciona para este link externo — a compra não passa pelo checkout interno.
            </p>
          </div>

          <div>
            <label className={labelClass}>Imagem de capa</label>
            <ImageUploader
              name="thumbnailUrl"
              folder="courses"
              aspectHint="16:9"
              label="Imagem de capa"
              initialUrl={course.thumbnailUrl}
            />
          </div>

          <div className="pt-2">
            <button type="submit" className={btnPrimary}>Salvar dados do curso</button>
          </div>
        </form>
      </section>
      )}

      {/* ── Conteúdo da Página ── */}
      {aba === "venda" && (
      <section className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-1">
          Conteúdo da Página do Curso
        </h2>
        <p className="font-sans text-xs text-muted mb-5">
          Cada linha vira um item com ✓ na página pública. Deixe em branco para ocultar a seção.
        </p>
        <form action={updateCourseContentAction} className="space-y-4">

          <div>
            <label className={labelClass}>Data / Período (presencial)</label>
            <input
              name="startDateLabel"
              defaultValue={course.startDateLabel ?? ""}
              placeholder="Ex: 15–19 de junho de 2026"
              className={inputClass}
            />
            <p className="font-sans text-[10px] text-muted mt-1">
              Aparece como destaque no topo da página do curso.
            </p>
          </div>

          <div>
            <label className={labelClass}>O que você vai aprender (objetivos)</label>
            <textarea
              name="objectives"
              defaultValue={course.objectives ?? ""}
              rows={5}
              placeholder={"Realizar manometria esofágica com autonomia\nInterpretar laudos de pHmetria de 24 horas\nClassificar padrões segundo a Classificação de Chicago 4.0"}
              className={`${inputClass} resize-none font-mono text-xs`}
            />
          </div>

          <div>
            <label className={labelClass}>Público-alvo</label>
            <textarea
              name="targetAudience"
              defaultValue={course.targetAudience ?? ""}
              rows={4}
              placeholder={"Médicos gastroenterologistas\nClínicos gerais e internistas\nResidentes em Gastroenterologia"}
              className={`${inputClass} resize-none font-mono text-xs`}
            />
          </div>

          <div>
            <label className={labelClass}>O que está incluído</label>
            <textarea
              name="includes"
              defaultValue={course.includes ?? ""}
              rows={5}
              placeholder={"40h de treinamento presencial supervisionado\nMaterial didático digital\nCertificado digital com QR Code\nCoffee break\nGrupo de suporte pós-curso"}
              className={`${inputClass} resize-none font-mono text-xs`}
            />
          </div>

          <div className="pt-2">
            <button type="submit" className={btnPrimary}>Salvar conteúdo da página</button>
          </div>
        </form>
      </section>
      )}

      {/* ── Co-instrutor ── */}
      {aba === "informacoes" && (
      <section className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-1">
          Co-instrutor (opcional)
        </h2>
        <p className="font-sans text-xs text-muted mb-5">
          Para cursos em parceria. Aparece como segundo card de instrutor na página do curso.
        </p>
        <form action={updateCourseCoInstructorAction} className="space-y-4">
          <div>
            <label className={labelClass}>Nome</label>
            <input
              name="coInstructorName"
              defaultValue={course.coInstructorName ?? ""}
              placeholder="Ex: Dr. Dan Linetzky Waitzberg"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Credencial / Especialidade</label>
            <input
              name="coInstructorCredential"
              defaultValue={course.coInstructorCredential ?? ""}
              placeholder="Ex: Médico | CRM – 22052"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Foto (URL)</label>
            <ImageUploader
              name="coInstructorPhotoUrl"
              folder="instructors"
              aspectHint="1:1"
              label="Foto do co-instrutor"
              initialUrl={course.coInstructorPhotoUrl}
            />
          </div>
          <div>
            <label className={labelClass}>Bio</label>
            <textarea
              name="coInstructorBio"
              defaultValue={course.coInstructorBio ?? ""}
              rows={6}
              placeholder="Breve apresentação do co-instrutor…"
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label className={labelClass}>Instagram (URL completa)</label>
            <input
              name="coInstructorInstagram"
              type="url"
              defaultValue={course.coInstructorInstagram ?? ""}
              placeholder="https://www.instagram.com/username/"
              className={inputClass}
            />
          </div>
          <div className="pt-2">
            <button type="submit" className={btnPrimary}>Salvar co-instrutor</button>
          </div>
        </form>
      </section>
      )}

      {/* ── FAQ personalizado ── */}
      {aba === "venda" && (
      <section className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-1">
          Perguntas Frequentes (FAQ)
        </h2>
        <p className="font-sans text-xs text-muted mb-5">
          Personalize as perguntas exibidas na página pública deste curso. Deixe vazio para usar as perguntas padrão do tipo de curso.
        </p>
        <FaqEditor
          courseId={course.id}
          slug={course.slug}
          initial={course.faqJson ? (JSON.parse(course.faqJson) as { q: string; a: string }[]) : []}
        />
      </section>
      )}

      {/* ── Traduções ── */}
      {aba === "traducoes" && (
      <section className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-1">
          Traduções de Conteúdo
        </h2>
        <p className="font-sans text-xs text-muted mb-5">
          Deixe em branco para usar o texto em português como fallback automático.
        </p>

        {/* Both EN and ES sections are always visible — a single submit saves all 6 fields */}
        <form action={updateCourseTranslationsAction} className="space-y-4">

            {/* EN section */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-background border-b border-border">
                <span className="font-sans text-xs font-bold text-muted uppercase tracking-widest">🇺🇸 English</span>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className={labelClass}>Título (EN)</label>
                  <input name="titleEn" defaultValue={course.titleEn ?? ""} placeholder={course.title} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Descrição curta (EN)</label>
                  <input name="shortDescEn" defaultValue={course.shortDescEn ?? ""} placeholder={course.shortDesc ?? ""} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Descrição completa (EN)</label>
                  <textarea name="descriptionEn" defaultValue={course.descriptionEn ?? ""} placeholder={course.description} rows={4} className={`${inputClass} resize-none`} />
                </div>
              </div>
            </div>

            {/* ES section */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-background border-b border-border">
                <span className="font-sans text-xs font-bold text-muted uppercase tracking-widest">🇪🇸 Español</span>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className={labelClass}>Título (ES)</label>
                  <input name="titleEs" defaultValue={course.titleEs ?? ""} placeholder={course.title} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Descrição curta (ES)</label>
                  <input name="shortDescEs" defaultValue={course.shortDescEs ?? ""} placeholder={course.shortDesc ?? ""} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Descrição completa (ES)</label>
                  <textarea name="descriptionEs" defaultValue={course.descriptionEs ?? ""} placeholder={course.description} rows={4} className={`${inputClass} resize-none`} />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" className={btnPrimary}>Salvar traduções</button>
            </div>
          </form>
      </section>
      )}

      {aba === "traducoes" && (
        <TraducoesConteudo slug={slug} modules={course.modules} moduloId={modulo} />
      )}

      {/* ── Conteúdo: árvore + um item por vez ── */}
      {aba === "conteudo" && (
        <ConteudoCurso
          courseId={course.id}
          slug={slug}
          modules={course.modules}
          item={item}
          allInstructors={allInstructors.map((i) => ({ id: i.id, name: i.user.name, title: i.title }))}
        />
      )}

      {/* ── Provas: lista de questões + uma questão por vez ── */}
      {aba === "provas" && (
        <ProvasCurso
          slug={slug}
          modules={course.modules.map((m) => ({ id: m.id, title: m.title, quiz: m.quiz }))}
          moduloId={modulo}
          questaoId={questao}
          busca={q}
          vezesSorteada={vezesSorteada}
        />
      )}

      {/* Referências do curso */}
      {aba === "materiais" && (
      <section className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="font-serif text-xl font-medium text-foreground">Referências</h2>
          <p className="font-sans text-sm text-muted mt-0.5">Artigos e documentos de referência disponíveis para os alunos matriculados.</p>
        </div>
        <ReferencesManager courseSlug={slug} initial={courseReferences} />
      </section>
      )}

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
