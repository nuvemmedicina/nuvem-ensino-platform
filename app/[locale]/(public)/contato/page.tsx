import type { Metadata } from "next";
import { Mail, MapPin, Navigation, ArrowUpRight, HelpCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const EMAIL = "cursos@nuvemensino.com.br";
const WHATSAPP_URL = "https://wa.me/5531972291029";
const WHATSAPP_NUMERO = "(31) 97229-1029";
const MAPA_URL = "https://maps.app.goo.gl/Dvt9VvnELGjihfkU7";
const MAPA_EMBED =
  "https://www.google.com/maps?q=Cl%C3%ADnica+NU.V.E.M+Medicina+BH,+R.+Cear%C3%A1,+600+-+Santa+Efig%C3%AAnia,+Belo+Horizonte+-+MG&z=16&output=embed";

const redes = [
  {
    label: "Instagram",
    handle: "@nuvemensino",
    href: "https://instagram.com/nuvemensino",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" strokeWidth={0} />
      </svg>
    ),
  },
  {
    label: "YouTube",
    handle: "@nuvemensino",
    href: "https://youtube.com/@nuvemensino",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    handle: "/nuvemensino",
    href: "https://facebook.com/nuvemensino",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
];

function IconeWhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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
      title: `${t("title")} | NU.V.E.M Ensino`,
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
      <section className="bg-canvas px-4 pt-16 pb-24">
        <div className="max-w-5xl mx-auto">
          <span className="font-sans text-xs font-semibold tracking-[0.25em] uppercase text-accent opacity-80 mb-4 block">
            {t("badge")}
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-light text-white mb-4">{t("title")}</h1>
          <p className="font-sans text-base text-white/60 max-w-2xl leading-relaxed">{t("description")}</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 -mt-12 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Canais de atendimento */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="p-6 bg-surface border border-border rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-[#25D366]/15 flex items-center justify-center">
                  <IconeWhatsApp className="w-5 h-5 text-[#128C7E]" />
                </div>
                <div>
                  <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">
                    {t("whatsappLabel")}
                  </p>
                  <p className="font-sans text-base text-foreground font-semibold">{WHATSAPP_NUMERO}</p>
                </div>
              </div>
              <p className="font-sans text-sm text-muted mb-5 leading-relaxed">{t("whatsappHint")}</p>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 font-sans text-sm font-semibold px-6 py-3 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                <IconeWhatsApp className="w-4 h-4" />
                {t("whatsappButton")}
              </a>
            </div>

            <div className="p-6 bg-surface border border-border rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">
                    {t("emailLabel")}
                  </p>
                  <p className="font-sans text-base text-foreground font-semibold break-all">{EMAIL}</p>
                </div>
              </div>
              <p className="font-sans text-sm text-muted mb-5 leading-relaxed">{t("emailHint")}</p>
              <a
                href={`mailto:${EMAIL}`}
                className="flex items-center justify-center gap-2 font-sans text-sm font-semibold px-6 py-3 rounded-full border border-border text-foreground hover:border-primary/40 transition-colors"
              >
                <Mail className="w-4 h-4" />
                {t("sendEmail")}
              </a>
            </div>

            <div className="p-6 bg-surface border border-border rounded-2xl shadow-sm">
              <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-1">
                {t("socialLabel")}
              </p>
              <p className="font-sans text-sm text-muted mb-4 leading-relaxed">{t("socialHint")}</p>
              <ul className="flex flex-col gap-1">
                {redes.map((rede) => (
                  <li key={rede.label}>
                    <a
                      href={rede.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 px-3 py-2.5 -mx-3 rounded-xl hover:bg-primary/5 transition-colors"
                    >
                      <span className="text-primary">{rede.icon}</span>
                      <span className="font-sans text-sm font-medium text-foreground">{rede.label}</span>
                      <span className="font-sans text-sm text-muted">{rede.handle}</span>
                      <ArrowUpRight className="w-4 h-4 ml-auto text-muted group-hover:text-primary transition-colors" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Localização */}
          <div className="lg:col-span-3 flex flex-col bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="relative h-72 sm:h-96 lg:h-auto lg:flex-1 lg:min-h-[22rem]">
              <iframe
                src={MAPA_EMBED}
                title={t("mapTitle")}
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <div className="p-6 flex flex-col sm:flex-row sm:items-end gap-5">
              <div className="flex items-start gap-3 flex-1">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-1">
                    {t("locationLabel")}
                  </p>
                  <p className="font-sans text-base text-foreground font-semibold">{t("locationPlace")}</p>
                  <address className="not-italic font-sans text-sm text-muted leading-relaxed">
                    {t("addressLine1")}
                    <br />
                    {t("addressLine2")}
                    <br />
                    {t("addressLine3")}
                  </address>
                </div>
              </div>
              <a
                href={MAPA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center justify-center gap-2 font-sans text-sm font-semibold px-6 py-3 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                <Navigation className="w-4 h-4" />
                {t("directions")}
              </a>
            </div>
          </div>
        </div>

        {/* Perguntas frequentes */}
        <div className="mt-5 p-6 sm:p-8 bg-canvas rounded-2xl flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="shrink-0 w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <p className="font-serif text-xl text-white mb-1">{t("faqTitle")}</p>
            <p className="font-sans text-sm text-white/60">{t("faqPrompt")}</p>
          </div>
          <Link
            href="/faq"
            className="shrink-0 text-center font-sans text-sm font-semibold px-6 py-3 rounded-full bg-white text-canvas hover:bg-white/90 transition-colors"
          >
            {t("faqLink")}
          </Link>
        </div>
      </section>
    </div>
  );
}
