import type { Metadata } from "next";
import { Mail, MessageCircle, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: locale === "en" ? "/en/contact" : locale === "es" ? "/es/contacto" : "/contato",
      languages: {
        pt: "/contato",
        en: "/en/contact",
        es: "/es/contacto",
        "x-default": "/contato",
      },
    },
    openGraph: {
      title: `${t("title")} | NU.V.E.M ENSINO`,
      description: t("description"),
      url: locale === "en" ? "/en/contact" : locale === "es" ? "/es/contacto" : "/contato",
      locale: locale === "en" ? "en_US" : locale === "es" ? "es_ES" : "pt_BR",
    },
  };
}

export default async function ContatoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });

  return (
    <div className="min-h-screen">
      <section className="bg-canvas px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <span className="font-sans text-xs font-semibold tracking-[0.25em] uppercase text-accent opacity-80 mb-4 block">
            {t("badge")}
          </span>
          <h1 className="font-serif text-4xl font-light text-white mb-3">{t("title")}</h1>
          <p className="font-sans text-sm text-white/60 max-w-xl">{t("description")}</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="mailto:cursos@nuvemensino.com.br"
            className="flex items-start gap-4 p-6 bg-surface border border-border rounded-2xl hover:border-primary/40 transition-colors"
          >
            <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-1">
                {t("emailLabel")}
              </p>
              <p className="font-sans text-sm text-foreground font-medium">cursos@nuvemensino.com.br</p>
            </div>
          </a>

          <a
            href="https://wa.me/5531972291029"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 p-6 bg-surface border border-border rounded-2xl hover:border-primary/40 transition-colors"
          >
            <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-1">
                {t("whatsappLabel")}
              </p>
              <p className="font-sans text-sm text-foreground font-medium">{t("whatsappButton")}</p>
            </div>
          </a>

          <div className="flex items-start gap-4 p-6 bg-surface border border-border rounded-2xl sm:col-span-2">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-1">
                {t("locationLabel")}
              </p>
              <p className="font-sans text-sm text-foreground font-medium">{t("locationValue")}</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <a
            href="mailto:cursos@nuvemensino.com.br"
            className="font-sans text-sm font-semibold px-6 py-2.5 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors text-center"
          >
            {t("sendEmail")}
          </a>
          <a
            href="https://wa.me/5531972291029"
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-sm font-semibold px-6 py-2.5 rounded-full border border-border text-foreground hover:border-primary/40 transition-colors text-center"
          >
            {t("whatsappButton")}
          </a>
        </div>

        <p className="mt-10 font-sans text-sm text-muted">
          {t("faqPrompt")}{" "}
          <Link href="/faq" className="text-primary hover:underline">
            {t("faqLink")}
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
