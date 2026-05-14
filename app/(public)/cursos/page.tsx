import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Filter, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Cursos | Nuvem Ensino",
  description:
    "Explore nosso catálogo de cursos hands-on e online em gastroenterologia, motilidade digestiva e fisioterapia respiratória.",
};

const allCourses = [
  {
    slug: "manometria-phmetria-impedancia",
    name: "Manometria, pHmetria e Impedância",
    description:
      "Domine os principais exames de motilidade digestiva: manometria de alta resolução, pHmetria e impedância em ambiente clínico supervisionado.",
    price: 6500,
    hours: 16,
    category: "Hands-On" as const,
    specialty: "Gastroenterologia",
    instructorName: "Dr. Felipe Nelson",
    instructorPhoto: "/instructors/felipe-nelson.jpg",
    seats: 12,
    reservedPct: 60,
  },
  {
    slug: "manometria-anorretal",
    name: "Manometria Anorretal",
    description:
      "Técnicas avançadas de manometria anorretal de alta resolução com interpretação clínica aplicada ao diagnóstico de distúrbios funcionais.",
    price: 4500,
    hours: 12,
    category: "Hands-On" as const,
    specialty: "Gastroenterologia",
    instructorName: "Dra. Eliane Basques",
    instructorPhoto: "/instructors/dra-eliane.jpg",
    seats: 10,
    reservedPct: 40,
  },
  {
    slug: "testes-respiratorios",
    name: "Testes Respiratórios",
    description:
      "Espirometria, manovacuometria e curva fluxo-volume com interpretação avançada em módulo online ao vivo.",
    price: 2200,
    hours: 8,
    category: "Online" as const,
    specialty: "Fisioterapia",
    instructorName: "Dra. Vera Ângelo",
    instructorPhoto: "/instructors/dra-vera.jpg",
    seats: null,
    reservedPct: 0,
  },
  {
    slug: "fisioterapia-respiratoria",
    name: "Fisioterapia Respiratória",
    description:
      "Técnicas de reabilitação pulmonar e manejo de pacientes críticos com foco em prática clínica e procedimentos supervisionados.",
    price: 3500,
    hours: 12,
    category: "Hands-On" as const,
    specialty: "Fisioterapia",
    instructorName: "Dra. Anna Karoline",
    instructorPhoto: "/instructors/anna-karoline.jpg",
    seats: 14,
    reservedPct: 25,
  },
];

const instructors = [...new Set(allCourses.map((c) => c.instructorName))];
const specialties = [...new Set(allCourses.map((c) => c.specialty))];

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function CursosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const categoria = typeof params.categoria === "string" ? params.categoria : "";
  const especialidade = typeof params.especialidade === "string" ? params.especialidade : "";
  const instrutor = typeof params.instrutor === "string" ? params.instrutor : "";
  const precoMax = typeof params.precoMax === "string" ? Number(params.precoMax) : Infinity;
  const busca = typeof params.busca === "string" ? params.busca.toLowerCase() : "";

  const filtered = allCourses.filter((c) => {
    if (categoria && c.category.toLowerCase() !== categoria.toLowerCase()) return false;
    if (especialidade && c.specialty !== especialidade) return false;
    if (instrutor && c.instructorName !== instrutor) return false;
    if (precoMax < Infinity && c.price > precoMax) return false;
    if (busca && !c.name.toLowerCase().includes(busca) && !c.description.toLowerCase().includes(busca)) return false;
    return true;
  });

  function buildUrl(overrides: Record<string, string>) {
    const next: Record<string, string> = {
      ...(categoria && { categoria }),
      ...(especialidade && { especialidade }),
      ...(instrutor && { instrutor }),
      ...(busca && { busca }),
      ...overrides,
    };
    const q = new URLSearchParams(next).toString();
    return `/cursos${q ? `?${q}` : ""}`;
  }

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
            {filtered.length} curso{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
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
                  {especialidade && <input type="hidden" name="especialidade" value={especialidade} />}
                  {instrutor && <input type="hidden" name="instrutor" value={instrutor} />}
                </div>
              </form>

              {/* Categoria */}
              <div className="mb-6">
                <p className="font-sans text-[11px] font-bold uppercase tracking-widest text-muted mb-3">
                  Modalidade
                </p>
                <div className="flex flex-col gap-2">
                  {["", "hands-on", "online"].map((val) => (
                    <Link
                      key={val}
                      href={buildUrl({ categoria: val })}
                      className={`font-sans text-sm px-3 py-1.5 rounded-lg transition-colors ${
                        categoria === val
                          ? "bg-primary text-white"
                          : "text-muted hover:text-foreground hover:bg-background"
                      }`}
                    >
                      {val === "" ? "Todos" : val.charAt(0).toUpperCase() + val.slice(1)}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Especialidade */}
              <div className="mb-6">
                <p className="font-sans text-[11px] font-bold uppercase tracking-widest text-muted mb-3">
                  Especialidade
                </p>
                <div className="flex flex-col gap-2">
                  {["", ...specialties].map((val) => (
                    <Link
                      key={val}
                      href={buildUrl({ especialidade: val })}
                      className={`font-sans text-sm px-3 py-1.5 rounded-lg transition-colors ${
                        especialidade === val
                          ? "bg-primary text-white"
                          : "text-muted hover:text-foreground hover:bg-background"
                      }`}
                    >
                      {val === "" ? "Todas" : val}
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
                  {["", ...instructors].map((val) => (
                    <Link
                      key={val}
                      href={buildUrl({ instrutor: val })}
                      className={`font-sans text-sm px-3 py-1.5 rounded-lg transition-colors ${
                        instrutor === val
                          ? "bg-primary text-white"
                          : "text-muted hover:text-foreground hover:bg-background"
                      }`}
                    >
                      {val === "" ? "Todos" : val}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Limpar filtros */}
              {(categoria || especialidade || instrutor || busca) && (
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
            {filtered.length === 0 ? (
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
                {filtered.map((course) => (
                  <div
                    key={course.slug}
                    className="flex flex-col rounded-2xl bg-surface border border-border overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-300"
                  >
                    <div className="relative h-52 overflow-hidden">
                      <Image
                        src={course.instructorPhoto}
                        alt={course.instructorName}
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <span className="absolute bottom-3 left-4 font-sans text-[10px] font-semibold uppercase tracking-widest text-white bg-primary/80 px-2.5 py-1 rounded-full">
                        {course.category}
                      </span>
                      {course.seats && course.reservedPct > 0 && (
                        <span className="absolute bottom-3 right-4 font-sans text-[10px] font-semibold text-white/80">
                          {course.reservedPct}% Reservado
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col flex-1 p-6 gap-4">
                      <div>
                        <p className="font-sans text-[11px] text-muted mb-1">
                          {course.instructorName} · {course.specialty}
                        </p>
                        <h2 className="font-serif text-xl font-medium text-foreground leading-snug">
                          {course.name}
                        </h2>
                      </div>

                      <p className="font-sans text-xs text-muted leading-relaxed flex-1">
                        {course.description}
                      </p>

                      {course.seats && (
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between font-sans text-[11px] text-muted">
                            <span>Vagas disponíveis</span>
                            <span>{Math.round(course.seats * (1 - course.reservedPct / 100))}/{course.seats}</span>
                          </div>
                          <div className="h-1.5 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary/60 rounded-full"
                              style={{ width: `${course.reservedPct}%` }}
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
                            }).format(course.price)}
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
