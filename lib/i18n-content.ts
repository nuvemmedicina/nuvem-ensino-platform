/**
 * Helpers for picking the right locale-specific field from DB records.
 * All translation fields are nullable — PT-BR is always the authoritative fallback.
 */

export type LocalizedCourse = {
  title: string;
  shortDesc: string | null;
  description: string;
};

type CourseTranslatable = {
  title: string;
  shortDesc: string | null;
  description: string;
  titleEn: string | null;
  shortDescEn: string | null;
  descriptionEn: string | null;
  titleEs: string | null;
  shortDescEs: string | null;
  descriptionEs: string | null;
};

export function localizedCourse(
  course: CourseTranslatable,
  locale: string
): LocalizedCourse {
  if (locale === "en") {
    return {
      title:       course.titleEn       ?? course.title,
      shortDesc:   course.shortDescEn   ?? course.shortDesc,
      description: course.descriptionEn ?? course.description,
    };
  }
  if (locale === "es") {
    return {
      title:       course.titleEs       ?? course.title,
      shortDesc:   course.shortDescEs   ?? course.shortDesc,
      description: course.descriptionEs ?? course.description,
    };
  }
  // Default: PT-BR
  return {
    title:       course.title,
    shortDesc:   course.shortDesc,
    description: course.description,
  };
}

/** Módulo, tema ou aula com os campos de tradução (vazios = português). */
type ItemTraduzivel = {
  title: string;
  titleEs?: string | null;
  titleEn?: string | null;
  description?: string | null;
  descriptionEs?: string | null;
  descriptionEn?: string | null;
};

/** Troca título e descrição pelos do idioma, quando houver tradução. */
export function traduzirItem<T extends ItemTraduzivel>(item: T, locale: string): T {
  const titulo = locale === "es" ? item.titleEs : locale === "en" ? item.titleEn : null;
  const descricao = locale === "es" ? item.descriptionEs : locale === "en" ? item.descriptionEn : null;
  if (!titulo && !descricao) return item;
  return {
    ...item,
    title: titulo || item.title,
    ...(descricao ? { description: descricao } : {}),
  };
}

/**
 * Aplica traduzirItem aos módulos, temas e aulas de um curso já carregado,
 * mantendo o formato do objeto (só os títulos e descrições mudam).
 */
export function traduzirModulos<
  M extends ItemTraduzivel & {
    lessons?: ItemTraduzivel[];
    topics?: (ItemTraduzivel & { lessons?: ItemTraduzivel[] })[];
  },
>(modules: M[], locale: string): M[] {
  if (locale !== "es" && locale !== "en") return modules;
  return modules.map((m) => ({
    ...traduzirItem(m, locale),
    ...(m.lessons ? { lessons: m.lessons.map((l) => traduzirItem(l, locale)) } : {}),
    ...(m.topics
      ? {
          topics: m.topics.map((t) => ({
            ...traduzirItem(t, locale),
            ...(t.lessons ? { lessons: t.lessons.map((l) => traduzirItem(l, locale)) } : {}),
          })),
        }
      : {}),
  }));
}
