import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { localizedCourse } from "@/lib/i18n-content";
import CatalogoCursos, { type CursoCatalogo } from "./CatalogoCursos";

// Página guardada em cache e refeita no máximo a cada 5 minutos; os filtros
// rodam no navegador (ver CatalogoCursos).
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "courses.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: locale === "en" ? "/en/courses" : locale === "es" ? "/es/cursos" : "/cursos",
      languages: {
        pt: "/cursos",
        en: "/en/courses",
        es: "/es/cursos",
        "x-default": "/cursos",
      },
    },
    openGraph: {
      title: `${t("title")} | NU.V.E.M Ensino`,
      description: t("description"),
      url: locale === "en" ? "/en/courses" : locale === "es" ? "/es/cursos" : "/cursos",
      locale: locale === "en" ? "en_US" : locale === "es" ? "es_ES" : "pt_BR",
    },
  };
}

export default async function CursosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const rows = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    include: {
      instructor: { include: { user: true } },
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const cursos: CursoCatalogo[] = rows.map((course) => {
    const lc = localizedCourse(course, locale);
    return {
      slug: course.slug,
      category: course.category,
      price: Number(course.price),
      hours: course.hours,
      totalSeats: course.totalSeats,
      reservedSeats: course.reservedSeats,
      thumbnailUrl: course.thumbnailUrl,
      instructorName: course.instructor.user.name,
      instructorSlug: course.instructor.slug,
      tags: course.tags.map((t) => ({ slug: t.tag.slug, name: t.tag.name })),
      title: lc.title,
      shortDesc: lc.shortDesc,
      description: lc.description,
      buscaPt: `${course.title} ${course.description}`.toLowerCase(),
    };
  });

  // Data for filter options
  const allTags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  const allInstructors = await prisma.instructor.findMany({
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  const coursesBase =
    locale === "en" ? "/en/courses" : locale === "es" ? "/es/cursos" : "/cursos";

  return (
    <CatalogoCursos
      cursos={cursos}
      tags={allTags.map((t) => ({ slug: t.slug, name: t.name }))}
      instrutores={allInstructors.map((i) => ({ slug: i.slug, name: i.user.name ?? i.slug }))}
      coursesBase={coursesBase}
    />
  );
}
