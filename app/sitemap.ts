import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://nuvemensino.com.br";

type ChangeFreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

type LocaleUrls = { pt: string; en: string; es: string };

/**
 * Generates 3 sitemap entries (one per locale URL) for a given page,
 * each with hreflang alternates pointing to all 3 versions + x-default.
 * This is the format recommended by Google for multilingual sitemaps.
 */
function makeEntries(
  urls: LocaleUrls,
  opts: {
    lastModified?: Date;
    changeFrequency?: ChangeFreq;
    priority?: number;
  }
): MetadataRoute.Sitemap {
  const languages = {
    pt: urls.pt,
    en: urls.en,
    es: urls.es,
    "x-default": urls.pt, // Portuguese is the default locale
  };

  return [
    { url: urls.pt, ...opts, alternates: { languages } },
    { url: urls.en, ...opts, alternates: { languages } },
    { url: urls.es, ...opts, alternates: { languages } },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── Static pages ─────────────────────────────────────────────────────────

  const staticPages: MetadataRoute.Sitemap = [
    ...makeEntries(
      {
        pt: `${APP_URL}/`,
        en: `${APP_URL}/en/`,
        es: `${APP_URL}/es/`,
      },
      { lastModified: now, changeFrequency: "weekly", priority: 1.0 }
    ),
    ...makeEntries(
      {
        pt: `${APP_URL}/cursos`,
        en: `${APP_URL}/en/courses`,
        es: `${APP_URL}/es/cursos`,
      },
      { lastModified: now, changeFrequency: "weekly", priority: 0.9 }
    ),
    ...makeEntries(
      {
        pt: `${APP_URL}/sobre`,
        en: `${APP_URL}/en/about`,
        es: `${APP_URL}/es/sobre`,
      },
      { lastModified: now, changeFrequency: "monthly", priority: 0.8 }
    ),
    ...makeEntries(
      {
        pt: `${APP_URL}/instrutores`,
        en: `${APP_URL}/en/instructors`,
        es: `${APP_URL}/es/instructores`,
      },
      { lastModified: now, changeFrequency: "monthly", priority: 0.7 }
    ),
    ...makeEntries(
      {
        pt: `${APP_URL}/faq`,
        en: `${APP_URL}/en/faq`,
        es: `${APP_URL}/es/faq`,
      },
      { lastModified: now, changeFrequency: "monthly", priority: 0.6 }
    ),
    ...makeEntries(
      {
        pt: `${APP_URL}/privacidade`,
        en: `${APP_URL}/en/privacy`,
        es: `${APP_URL}/es/privacidad`,
      },
      { lastModified: now, changeFrequency: "yearly", priority: 0.3 }
    ),
    ...makeEntries(
      {
        pt: `${APP_URL}/termos`,
        en: `${APP_URL}/en/terms`,
        es: `${APP_URL}/es/terminos`,
      },
      { lastModified: now, changeFrequency: "yearly", priority: 0.3 }
    ),
  ];

  // ── Dynamic course pages ──────────────────────────────────────────────────

  let coursePages: MetadataRoute.Sitemap = [];
  try {
    const courses = await prisma.course.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    });

    coursePages = courses.flatMap((course) =>
      makeEntries(
        {
          pt: `${APP_URL}/cursos/${course.slug}`,
          en: `${APP_URL}/en/courses/${course.slug}`,
          es: `${APP_URL}/es/cursos/${course.slug}`,
        },
        {
          lastModified: course.updatedAt,
          changeFrequency: "weekly",
          priority: 0.85,
        }
      )
    );
  } catch {
    // Return only static pages if DB is unavailable at build time
  }

  return [...staticPages, ...coursePages];
}
