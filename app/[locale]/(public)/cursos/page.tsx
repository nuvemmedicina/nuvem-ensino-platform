import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Filter, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Cursos",
  description:
    "Catálogo completo de cursos hands-on e online em Gastroenterologia, Manometria Esofágica, Testes Respiratórios, pHmetria e Fisioterapia Pélvica. Formação prática com especialistas em Belo Horizonte.",
  alternates: { canonical: "/cursos" },
  openGraph: {
    title: "Cursos | NU.V.E.M Ensino",
    description:
      "Cursos hands-on e online de Gastroenterologia, Manometria, Testes Respiratórios e Fisioterapia Pélvica. Turmas reduzidas com especialistas.",
    url: "/cursos",
  },
};

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function CursosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const categoria = typeof params.categoria === "string" ? params.categoria : "";
  const tagSlug = typeof params.especialidade === "string" ? params.especialidade : "";
  const instructorSlug = typeof params.instrutor === "string" ? params.instrutor : "";
  const precoMax = typeof params.precoMax === "string" ? Number(params.precoMax) : undefined;
  const busca = typeof params.busca === "string" ? params.busca.toLowerCase() : "";

  const courses = await prisma.course.findMany({
    where: {
      status: "PUBLISHED",
      ...(categoria
        ? { category: categoria.toUpperCase().replace(/-/g, "_") as "HANDS_ON" | "ONLINE" | "HYBRID" }
        : {}),
      ...(tagSlug
        ? { tags: { some: { tag: { slug: tagSlug } } } }
        : {}),
      ...(instructorSlug
        ? { instructor: { slug: instructorSlug } }
        : {}),
      ...(precoMax !== undefined ? { price: { lte: precoMax } } : {}),
      ...(busca
        ? {
            OR: [
              { title: { contains: busca, mode: "insensitive" } },
              { description: { contains: busca, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      instructor: { include: { user: true } },
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Data for filter options
  const allTags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  const allInstructors = await prisma.instructor.findMany({
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  function buildUrl(overrides: Record<string, string>) {
    const next: Record<string, string> = {
      ...(categoria && { categoria }),
      ...(tagSlug && { especialidade: tagSlug }),
      ...(instructorSlug && { instrutor: instructorSlug }),
      ...(busca && { busca }),
      ...overrides,
    };
    const q = new URLSearchParams(next).toString();
    return `/cursos${q ? `?${q}` : ""}`;
  }

  const categoryLabel = (cat: string) =>
    cat === "HANDS_ON" ? "Hands-On" : cat === "ONLINE" ? "Online" : "Híbrido";

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <section className="bg-canvas px-4 py-14">
        <div className="max-w-5xl mx-auto">
          <span className="font-sans text-xs font-semibold tracking-[0.25em] uppercase text-accent mb-4 block opacity-80">
            Catálogo
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-light text-white mb-3">
            Todos os Cursos
          </h1>
          <p className="font-sans text-sm text-white/60 max-w-lg">
            {courses.length} curso{courses.length !== 1 ? "s" : ""} encontrado{courses.length !== 1 ? "s" : ""}
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* ── SIDEBAR FILTROS ── */}
          <aside className="lg:w-64 shrink-0">
            <div className="bg-surface border border-border rounded-2xl p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-4 h-4 text-primary" />
                <h2 className="font-sans text-sm font-semibold text-foreground">Filtros</h2>
              </div>

              {/* Busca */}
              <form method="GET" action="/cursos" className="mb-6">
                <label className="font-sans text-[11px] font-bold uppercase tracking-widest text-muted mb-2 block">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    name="busca"
                    defaultValue={busca}
                    placeholder="Nome ou conteúdo..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50"
                  />
                  {categoria && <input type="hidden" name="categoria" value={categoria} />}
                  {tagSlug && <input type="hidden" name="especialidade" value={tagSlug} />}
                  {instructorSlug && <input type="hidden" name="instrutor" value={instructorSlug} />}
                </div>
              </form>

              {/* Categoria */}
              <div className="mb-6">
                <p className="font-sans text-[11px] font-bold uppercase tracking-widest text-muted mb-3">
                  Modalidade
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    { val: "", label: "Todos" },
                    { val: "hands_on", label: "Hands-On" },
                    { val: "online", label: "Online" },
                  ].map(({ val, label }) => (
                    <Link
                      key={val}
                      href={buildUrl({ categoria: val })}
                      className={`font-sans text-sm px-3 py-1.5 rounded-lg transition-colors ${
                        categoria.toLowerCase() === val
                          ? "bg-primary text-white"
                          : "text-muted hover:text-foreground hover:bg-background"
                      }`}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Especialidade / Tags */}
              <div className="mb-6">
                <p className="font-sans text-[11px] font-bold uppercase tracking-widest text-muted mb-3">
                  Especialidade
                </p>
                <div className="flex flex-col gap-2">
                  {[{ slug: "", name: "Todas" }, ...allTags].map((tag) => (
                    <Link
                      key={tag.slug}
                      href={buildUrl({ especialidade: tag.slug })}
                      className={`font-sans text-sm px-3 py-1.5 rounded-lg transition-colors ${
                        tagSlug === tag.slug
                          ? "bg-primary text-white"
                          : "text-muted hover:text-foreground hover:bg-background"
                      }`}
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Instrutor */}
              <div className="mb-6">
                <p className="font-sans text-[11px] font-bold uppercase tracking-widest text-muted mb-3">
                  Instrutor
                </p>
                <div className="flex flex-col gap-2">
                  {[{ slug: "", name: "Todos" }, ...allInstructors.map((i) => ({ slug: i.slug, name: i.user.name ?? i.slug }))].map((inst) => (
                    <Link
                      key={inst.slug}
                      href={buildUrl({ instrutor: inst.slug })}
                      className={`font-sans text-sm px-3 py-1.5 rounded-lg transition-colors ${
                        instructorSlug === inst.slug
                          ? "bg-primary text-white"
                          : "text-muted hover:text-foreground hover:bg-background"
                      }`}
                    >
                      {inst.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Limpar filtros */}
              {(categoria || tagSlug || instructorSlug || busca) && (
                <Link
                  href="/cursos"
                  className="block font-sans text-xs text-center text-primary/70 hover:text-primary transition-colors mt-2"
                >
                  Limpar filtros
                </Link>
              )}
            </div>
          </aside>

          {/* ── GRID DE CURSOS ── */}
          <div className="flex-1 min-w-0">
            {courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="font-serif text-2xl text-foreground/40 mb-2">Nenhum curso encontrado</p>
                <p className="font-sans text-sm text-muted">
                  Tente ajustar os filtros ou{" "}
                  <Link href="/cursos" className="text-primary hover:underline">
                    ver todos os cursos
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {courses.map((course) => {
                  const reservedPct =
                    course.totalSeats && course.totalSeats > 0
                      ? Math.round(((course.reservedSeats ?? 0) / course.totalSeats) * 100)
                      : 0;
                  const availableSeats =
                    course.totalSeats !== null
                      ? course.totalSeats - (course.reservedSeats ?? 0)
                      : null;

                  return (
                    <div
                      key={course.slug}
                      className="flex flex-col rounded-2xl bg-surface border border-border overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-300"
                    >
                      <div className="relative h-52 overflow-hidden">
                        {course.thumbnailUrl ? (
                          <Image
                            src={course.thumbnailUrl}
                            alt={course.instructor.user.name ?? course.title}
                            fill
                            className="object-cover object-top"
                            sizes="(max-width: 640px) 100vw, 50vw"
                          />
                        ) : (
                          <div className="w-full h-full bg-canvas" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <span className="absolute bottom-3 left-4 font-sans text-[10px] font-semibold uppercase tracking-widest text-white bg-primary/80 px-2.5 py-1 rounded-full">
                          {categoryLabel(course.category)}
                        </span>
                        {course.totalSeats && reservedPct > 0 && (
                          <span className="absolute bottom-3 right-4 font-sans text-[10px] font-semibold text-white/80">
                            {reservedPct}% Reservado
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col flex-1 p-6 gap-4">
                        <div>
                          <p className="font-sans text-[11px] text-muted mb-1">
                            {course.instructor.user.name}
                            {course.tags.length > 0 && ` · ${course.tags[0].tag.name}`}
                          </p>
                          <h2 className="font-serif text-xl font-medium text-foreground leading-snug">
                            {course.title}
                          </h2>
                        </div>

                        <p className="font-sans text-xs text-muted leading-relaxed flex-1">
                          {course.shortDesc ?? course.description}
                        </p>

                        {course.totalSeats && (
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between font-sans text-[11px] text-muted">
                              <span>Vagas disponíveis</span>
                              <span>{availableSeats}/{course.totalSeats}</span>
                            </div>
                            <div className="h-1.5 bg-border rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary/60 rounded-full"
                                style={{ width: `${reservedPct}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div className="flex flex-col">
                            <span className="font-serif text-xl font-semibold text-primary">
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(Number(course.price))}
                            </span>
                            <span className="font-sans text-[10px] text-muted/70 tracking-wide">
                              {course.hours}h de formação
                            </span>
                          </div>
                          <Link
                            href={`/cursos/${course.slug}`}
                            className="font-sans text-xs font-semibold px-4 py-2 rounded-full border border-primary text-primary hover:bg-primary hover:text-white transition-all"
                          >
                            Saiba mais
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
