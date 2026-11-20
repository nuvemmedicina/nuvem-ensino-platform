"use client";

import { Suspense } from "react";
import Image from "next/image";
import NativeLink from "next/link";
import { useSearchParams } from "next/navigation";
import { Filter, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { mostraNumeroDeVagas } from "@/lib/vagasExibicao";

/**
 * Catálogo de /cursos com os filtros aplicados no navegador.
 *
 * Antes a página lia os filtros da URL no servidor, e isso obrigava a Vercel a
 * montar a página de novo a cada visita (foi a 2ª rota que mais gastou CPU e
 * levou o site a ser pausado em 20/11/2026). Agora o servidor entrega a lista
 * completa de cursos publicados, guardada em cache, e o filtro acontece aqui.
 */

export type CursoCatalogo = {
  slug: string;
  category: string;
  price: number;
  hours: number;
  totalSeats: number | null;
  reservedSeats: number | null;
  thumbnailUrl: string | null;
  instructorName: string | null;
  instructorSlug: string;
  tags: { slug: string; name: string }[];
  title: string;
  shortDesc: string | null;
  description: string;
  /** Título e descrição em português, que é onde a busca procurava antes */
  buscaPt: string;
};

type Opcao = { slug: string; name: string };

type Props = {
  cursos: CursoCatalogo[];
  tags: Opcao[];
  instrutores: Opcao[];
  coursesBase: string;
};

type Filtros = {
  categoria: string;
  tagSlug: string;
  instructorSlug: string;
  precoMax?: number;
  busca: string;
};

const SEM_FILTRO: Filtros = { categoria: "", tagSlug: "", instructorSlug: "", busca: "" };

export default function CatalogoCursos(props: Props) {
  // Sem o Suspense, ler a URL tiraria a página do cache. O fallback é a lista
  // sem filtro, que é o que buscadores e quem chega sem filtro precisam ver.
  return (
    <Suspense fallback={<Catalogo {...props} filtros={SEM_FILTRO} />}>
      <CatalogoComFiltrosDaUrl {...props} />
    </Suspense>
  );
}

function CatalogoComFiltrosDaUrl(props: Props) {
  const sp = useSearchParams();
  const precoMax = sp.get("precoMax");
  const filtros: Filtros = {
    categoria: sp.get("categoria") ?? "",
    tagSlug: sp.get("especialidade") ?? "",
    instructorSlug: sp.get("instrutor") ?? "",
    precoMax: precoMax ? Number(precoMax) : undefined,
    busca: (sp.get("busca") ?? "").toLowerCase(),
  };
  return <Catalogo {...props} filtros={filtros} />;
}

function Catalogo({ cursos, tags, instrutores, coursesBase, filtros }: Props & { filtros: Filtros }) {
  const t = useTranslations("courses");
  const { categoria, tagSlug, instructorSlug, precoMax, busca } = filtros;

  const categoriaEnum = categoria ? categoria.toUpperCase().replace(/-/g, "_") : "";
  const courses = cursos.filter(
    (c) =>
      (!categoriaEnum || c.category === categoriaEnum) &&
      (!tagSlug || c.tags.some((tg) => tg.slug === tagSlug)) &&
      (!instructorSlug || c.instructorSlug === instructorSlug) &&
      (precoMax === undefined || Number.isNaN(precoMax) || c.price <= precoMax) &&
      (!busca || c.buscaPt.includes(busca)),
  );

  function buildUrl(overrides: Record<string, string>) {
    const next: Record<string, string> = {
      ...(categoria && { categoria }),
      ...(tagSlug && { especialidade: tagSlug }),
      ...(instructorSlug && { instrutor: instructorSlug }),
      ...(busca && { busca }),
      ...overrides,
    };
    // Remove empty-string values (e.g. clearing a filter)
    for (const key of Object.keys(next)) {
      if (next[key] === "") delete next[key];
    }
    const q = new URLSearchParams(next).toString();
    return `${coursesBase}${q ? `?${q}` : ""}`;
  }

  const categoryLabel = (cat: string) =>
    cat === "HANDS_ON" ? "Hands-On" : cat === "ONLINE" ? "Online" : "Híbrido";

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <section className="bg-canvas px-4 py-14">
        <div className="max-w-5xl mx-auto">
          <span className="font-sans text-xs font-semibold tracking-[0.25em] uppercase text-accent mb-4 block opacity-80">
            {t("badge")}
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-light text-white mb-3">
            {t("title")}
          </h1>
          <p className="font-sans text-sm text-white/60 max-w-lg">
            {courses.length === 1
              ? t("found", { count: courses.length })
              : t("foundPlural", { count: courses.length })}
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
                <h2 className="font-sans text-sm font-semibold text-foreground">{t("filters.title")}</h2>
              </div>

              {/* Busca */}
              <form method="GET" action={coursesBase} className="mb-6">
                <label className="font-sans text-[11px] font-bold uppercase tracking-widest text-muted mb-2 block">
                  {t("filters.search")}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    key={busca}
                    name="busca"
                    defaultValue={busca}
                    placeholder={t("filters.searchPlaceholder")}
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
                  {t("filters.modality")}
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    { val: "", label: t("filters.all") },
                    { val: "hands_on", label: t("filters.handsOn") },
                    { val: "online", label: t("filters.online") },
                  ].map(({ val, label }) => (
                    <NativeLink
                      key={val}
                      href={buildUrl({ categoria: val })}
                      scroll={false}
                      className={`font-sans text-sm px-3 py-1.5 rounded-lg transition-colors ${
                        categoria.toLowerCase() === val
                          ? "bg-primary text-white"
                          : "text-muted hover:text-foreground hover:bg-background"
                      }`}
                    >
                      {label}
                    </NativeLink>
                  ))}
                </div>
              </div>

              {/* Especialidade / Tags */}
              <div className="mb-6">
                <p className="font-sans text-[11px] font-bold uppercase tracking-widest text-muted mb-3">
                  {t("filters.specialty")}
                </p>
                <div className="flex flex-col gap-2">
                  {[{ slug: "", name: t("filters.allSpecialties") }, ...tags].map((tag) => (
                    <NativeLink
                      key={tag.slug}
                      href={buildUrl({ especialidade: tag.slug })}
                      scroll={false}
                      className={`font-sans text-sm px-3 py-1.5 rounded-lg transition-colors ${
                        tagSlug === tag.slug
                          ? "bg-primary text-white"
                          : "text-muted hover:text-foreground hover:bg-background"
                      }`}
                    >
                      {tag.name}
                    </NativeLink>
                  ))}
                </div>
              </div>

              {/* Instrutor */}
              <div className="mb-6">
                <p className="font-sans text-[11px] font-bold uppercase tracking-widest text-muted mb-3">
                  {t("filters.instructor")}
                </p>
                <div className="flex flex-col gap-2">
                  {[{ slug: "", name: t("filters.allInstructors") }, ...instrutores].map((inst) => (
                    <NativeLink
                      key={inst.slug}
                      href={buildUrl({ instrutor: inst.slug })}
                      scroll={false}
                      className={`font-sans text-sm px-3 py-1.5 rounded-lg transition-colors ${
                        instructorSlug === inst.slug
                          ? "bg-primary text-white"
                          : "text-muted hover:text-foreground hover:bg-background"
                      }`}
                    >
                      {inst.name}
                    </NativeLink>
                  ))}
                </div>
              </div>

              {/* Limpar filtros */}
              {(categoria || tagSlug || instructorSlug || busca) && (
                <NativeLink
                  href={coursesBase}
                  scroll={false}
                  className="block font-sans text-xs text-center text-primary/70 hover:text-primary transition-colors mt-2"
                >
                  {t("filters.clearFilters")}
                </NativeLink>
              )}
            </div>
          </aside>

          {/* ── GRID DE CURSOS ── */}
          <div className="flex-1 min-w-0">
            {courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="font-serif text-2xl text-foreground/40 mb-2">{t("empty.title")}</p>
                <p className="font-sans text-sm text-muted">
                  {t("empty.description")}{" "}
                  <NativeLink href={coursesBase} className="text-primary hover:underline">
                    {t("empty.viewAll")}
                  </NativeLink>
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
                      <div className="relative h-64 sm:h-56 overflow-hidden">
                        {course.thumbnailUrl ? (
                          <Image
                            src={course.thumbnailUrl}
                            alt={course.instructorName ?? course.title}
                            fill
                            className="object-cover object-[center_15%]"
                            sizes="(max-width: 640px) 100vw, 50vw"
                          />
                        ) : (
                          <div className="w-full h-full bg-canvas" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <span className="absolute bottom-3 left-4 font-sans text-[10px] font-semibold uppercase tracking-widest text-white bg-primary/80 px-2.5 py-1 rounded-full">
                          {categoryLabel(course.category)}
                        </span>
                        {course.totalSeats && reservedPct > 0 && mostraNumeroDeVagas(course.slug) && (
                          <span className="absolute bottom-3 right-4 font-sans text-[10px] font-semibold text-white/80">
                            {t("card.reserved", { pct: reservedPct })}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col flex-1 p-6 gap-4">
                        <div>
                          <p className="font-sans text-[11px] text-muted mb-1">
                            {course.instructorName}
                            {course.tags.length > 0 && ` · ${course.tags[0].name}`}
                          </p>
                          <h2 className="font-serif text-xl font-medium text-foreground leading-snug">
                            {course.title}
                          </h2>
                        </div>

                        <p className="font-sans text-xs text-muted leading-relaxed flex-1">
                          {course.shortDesc ?? course.description}
                        </p>

                        {course.totalSeats && !mostraNumeroDeVagas(course.slug) && (
                          <p className="font-sans text-[11px] font-semibold text-primary">
                            {availableSeats !== null && availableSeats <= 0 ? t("card.soldOut") : t("card.limitedSeats")}
                          </p>
                        )}
                        {course.totalSeats && mostraNumeroDeVagas(course.slug) && (
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between font-sans text-[11px] text-muted">
                              <span>{t("card.seats")}</span>
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
                              }).format(course.price)}
                            </span>
                            <span className="font-sans text-[10px] text-muted/70 tracking-wide">
                              {t("card.training", { hours: course.hours })}
                            </span>
                          </div>
                          <Link
                            href={{ pathname: "/cursos/[slug]", params: { slug: course.slug } }}
                            className="font-sans text-xs font-semibold px-4 py-2 rounded-full border border-primary text-primary hover:bg-primary hover:text-white transition-all"
                          >
                            {t("card.learnMore")}
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
