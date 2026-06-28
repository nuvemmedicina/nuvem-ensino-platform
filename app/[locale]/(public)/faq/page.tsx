import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import FaqClient from "./FaqClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: locale === "en" ? "/en/faq" : locale === "es" ? "/es/faq" : "/faq",
      languages: {
        pt: "/faq",
        en: "/en/faq",
        es: "/es/faq",
        "x-default": "/faq",
      },
    },
    openGraph: {
      title: `${t("title")} | NU.V.E.M ENSINO`,
      description: t("description"),
      url: locale === "en" ? "/en/faq" : locale === "es" ? "/es/faq" : "/faq",
      locale: locale === "en" ? "en_US" : locale === "es" ? "es_ES" : "pt_BR",
    },
  };
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });

  return (
    <div className="min-h-screen">
      <section className="bg-canvas px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <span className="font-sans text-xs font-semibold tracking-[0.25em] uppercase text-accent opacity-80 mb-4 block">
            {t("badge")}
          </span>
          <h1 className="font-serif text-4xl font-light text-white mb-3">{t("title")}</h1>
          <p className="font-sans text-sm text-white/50">
            {t("contactPrompt")}{" "}
            <a href="mailto:cursos@nuvemensino.com.br" className="text-accent hover:underline">
              {t("contactLink")}
            </a>
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12">
        <FaqClient locale={locale} />

        <div className="mt-12 p-6 bg-surface border border-border rounded-2xl text-center">
          <p className="font-sans text-sm text-muted mb-4">
            {t("stillHaveQuestions")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:cursos@nuvemensino.com.br"
              className="font-sans text-sm font-semibold px-6 py-2.5 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              {t("sendEmail")}
            </a>
            <a
              href="https://wa.me/5531972291029"
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-sm font-semibold px-6 py-2.5 rounded-full border border-border text-foreground hover:border-primary/40 transition-colors"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
