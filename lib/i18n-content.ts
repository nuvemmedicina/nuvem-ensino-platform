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
