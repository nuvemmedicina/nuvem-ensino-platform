import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://nuvemensino.com.br";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${APP_URL}/cursos`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${APP_URL}/sobre`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/instrutores`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${APP_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${APP_URL}/privacidade`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${APP_URL}/termos`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Páginas dinâmicas de cursos
  let coursePages: MetadataRoute.Sitemap = [];
  try {
    const courses = await prisma.course.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    });
    coursePages = courses.map((course) => ({
      url: `${APP_URL}/cursos/${course.slug}`,
      lastModified: course.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));
  } catch {
    // Em caso de erro no build, retorna apenas as estáticas
  }

  return [...staticPages, ...coursePages];
}
