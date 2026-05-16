import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return {
    title: t("title"),
    description: t("lastUpdated"),
    alternates: {
      canonical: locale === "en" ? "/en/privacy" : locale === "es" ? "/es/privacidad" : "/privacidade",
      languages: {
        pt: "/privacidade",
        en: "/en/privacy",
        es: "/es/privacidad",
        "x-default": "/privacidade",
      },
    },
  };
}

export default async function PrivacidadePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  const sections = t.raw("sections") as { title: string; text: string }[];

  return (
    <div className="min-h-screen">
      <section className="bg-canvas px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-4xl font-light text-white mb-3">{t("title")}</h1>
          <p className="font-sans text-sm text-white/50">{t("lastUpdated")}</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {sections.map(({ title, text }) => (
            <div key={title}>
              <h2 className="font-sans text-sm font-bold text-foreground mb-2">{title}</h2>
              <p className="font-sans text-sm text-muted leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
