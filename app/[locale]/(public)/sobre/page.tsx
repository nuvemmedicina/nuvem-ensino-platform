import type { Metadata } from "next";
import Image from "next/image";
import { Award, BookOpen, Users, MapPin, ExternalLink, Star, GraduationCap, Microscope, Globe } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: locale === "en" ? "/en/about" : locale === "es" ? "/es/sobre" : "/sobre",
      languages: {
        pt: "/sobre",
        en: "/en/about",
        es: "/es/sobre",
        "x-default": "/sobre",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: locale === "en" ? "/en/about" : locale === "es" ? "/es/sobre" : "/sobre",
      locale: locale === "en" ? "en_US" : locale === "es" ? "es_ES" : "pt_BR",
    },
  };
}

// Fotos estáticas como fallback enquanto o upload não é feito
const staticPhotos: Record<string, string> = {
  "dra-vera-angelo": "/instructors/dra-vera.jpg",
  "dra-eliane-basques": "/instructors/dra-eliane.jpg",
  "dr-wanderley-bertoni": "/instructors/wanderley-bertoni.jpg",
  "dr-felipe-nelson": "/instructors/felipe-nelson.jpg",
  "dra-anna-karoline": "/instructors/anna-karoline.jpg",
};

export default async function SobrePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  // Instrutores do banco — com fallback de foto estática
  const dbInstructors = await prisma.instructor.findMany({
    include: { user: { select: { name: true, image: true } } },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });

  const numeros = [
    { icon: Star,          valor: "+2.000",          label: t("numbers.googleReviews") },
    { icon: GraduationCap, valor: "Centenas",        label: t("numbers.professionals") },
    { icon: Microscope,    valor: "6",               label: t("numbers.specialties") },
    { icon: Award,         valor: "ISO 9001",        label: t("numbers.certification") },
    { icon: Globe,         valor: "Brasil e exterior", label: t("numbers.students") },
  ];

  const diferenciais = [
    { icon: Award,    title: t("differentials.iso.title"),       desc: t("differentials.iso.desc") },
    { icon: BookOpen, title: t("differentials.realCases.title"), desc: t("differentials.realCases.desc") },
    { icon: Users,    title: t("differentials.specialists.title"), desc: t("differentials.specialists.desc") },
    { icon: MapPin,   title: t("differentials.location.title"),  desc: t("differentials.location.desc") },
  ];

  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="bg-canvas px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <span className="font-sans text-xs font-semibold tracking-[0.25em] uppercase text-accent opacity-80 mb-4 block">
            {t("hero.badge")}
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-light text-white mb-6 leading-tight">
            {t("hero.title")}
          </h1>
          <p className="font-sans text-base text-white/60 max-w-2xl mx-auto leading-relaxed">
            {t("hero.description")}
          </p>
        </div>
      </section>

      {/* Fundadoras */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-primary mb-3">
              {t("founders.badge")}
            </p>
            <h2 className="font-serif text-3xl font-medium text-foreground mb-5">
              {t("founders.title")}
            </h2>
            <div className="space-y-4 font-sans text-sm text-muted leading-relaxed">
              <p>{t("founders.p1")}</p>
              <p>{t("founders.p2")}</p>
              <p>{t("founders.p3")}</p>
              <p>{t("founders.p4")}</p>
            </div>
          </div>

          {/* ISO 9001 */}
          <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <Image
                src="/selo-iso-9001.png"
                alt="ISO 9001"
                width={72}
                height={72}
                className="w-16 h-16 object-contain shrink-0"
              />
              <div>
                <p className="font-sans text-xs font-bold uppercase tracking-widest text-primary mb-1">
                  {t("iso.badge")}
                </p>
                <h3 className="font-serif text-xl font-medium text-foreground leading-snug">
                  {t("iso.title")}
                </h3>
              </div>
            </div>
            <p className="font-sans text-sm text-muted leading-relaxed">
              {t("iso.text")}
            </p>
            <p className="font-sans text-sm text-foreground font-medium leading-relaxed border-l-2 border-primary pl-4">
              {t("iso.quote")}
            </p>
            <a
              href="https://nuvemmedicina.com.br/gestao-da-qualidade-iso-9001/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-sans text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              {t("iso.link")}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Nossos números */}
      <section className="relative bg-canvas py-20 px-4 overflow-hidden">
        {/* Grade de fundo */}
        <div aria-hidden className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(203,228,230,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(203,228,230,0.04) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        {/* Orb decorativo */}
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(ellipse, rgba(203,228,230,0.6) 0%, transparent 70%)" }}
        />

        <div className="relative max-w-5xl mx-auto">
          <p className="font-sans text-xs font-bold uppercase tracking-[0.25em] text-accent/70 text-center mb-3">
            Em números
          </p>
          <h2 className="font-serif text-3xl font-light text-white text-center mb-12">
            {t("numbers.title")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {numeros.map(({ icon: Icon, valor, label }) => (
              <div
                key={label}
                className="group relative flex flex-col items-center gap-3 p-6 rounded-2xl text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] cursor-default"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(203,228,230,0.12)",
                  backdropFilter: "blur(12px)",
                }}
              >
                {/* Brilho no hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "linear-gradient(135deg, rgba(203,228,230,0.08) 0%, transparent 60%)" }}
                />
                <div className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300"
                  style={{ background: "rgba(203,228,230,0.1)" }}>
                  <Icon className="w-5 h-5 text-accent group-hover:text-accent/90 transition-colors" />
                </div>
                <p className="relative font-serif text-xl font-semibold text-white leading-tight">{valor}</p>
                <p className="relative font-sans text-[11px] text-white/45 leading-snug group-hover:text-white/60 transition-colors">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O que significa NU.V.E.M */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="font-sans text-xs font-bold uppercase tracking-widest text-primary mb-4">
          {t("meaning.badge")}
        </p>
        <h2 className="font-serif text-3xl font-medium text-foreground mb-6 leading-snug">
          {t("meaning.title")}
        </h2>
        <div className="space-y-4 font-sans text-sm text-muted leading-relaxed max-w-2xl mx-auto">
          <p>{t("meaning.p1")}</p>
          <p>{t("meaning.p2")}</p>
        </div>
        <blockquote className="mt-10 mx-auto max-w-2xl bg-surface border border-border rounded-2xl px-8 py-8">
          <p className="font-serif text-lg text-foreground italic leading-relaxed mb-4">
            &ldquo;{t("meaning.quote")}&rdquo;
          </p>
          <footer className="font-sans text-xs text-primary font-semibold tracking-wide uppercase">
            {t("meaning.quoteAuthor")}
          </footer>
        </blockquote>
      </section>

      {/* Diferenciais */}
      <section className="bg-surface border-y border-border py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-serif text-2xl font-medium text-foreground text-center mb-10">
            {t("differentials.title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {diferenciais.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-6 bg-background rounded-2xl border border-border">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-sans text-sm font-semibold text-foreground mb-1">{title}</h3>
                  <p className="font-sans text-xs text-muted leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Corpo docente */}
      {dbInstructors.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="font-serif text-2xl font-medium text-foreground text-center mb-10">
            {t("faculty.title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {dbInstructors.map((inst) => {
              const photo = inst.photoUrl ?? inst.user.image ?? staticPhotos[inst.slug] ?? null;
              const crm = [inst.crm, inst.rqe].filter(Boolean).join(" · ");
              return (
                <div key={inst.id} className="bg-surface border border-border rounded-2xl p-6 flex gap-5">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-primary/10">
                    {photo ? (
                      <Image
                        src={photo}
                        alt={inst.user.name ?? ""}
                        fill
                        className="object-cover object-top"
                        sizes="80px"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-serif text-2xl font-light text-primary/40">
                          {(inst.user.name ?? "?")[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-lg font-medium text-foreground">{inst.user.name}</h3>
                    {inst.title && (
                      <p className="font-sans text-xs text-primary font-semibold mt-0.5 mb-1">{inst.title}</p>
                    )}
                    {crm && (
                      <p className="font-sans text-[10px] text-muted mb-1">{crm}</p>
                    )}
                    {inst.formation && (
                      <p className="font-sans text-[10px] text-muted/70 mb-2">{inst.formation}</p>
                    )}
                    {inst.bio && (
                      <p className="font-sans text-xs text-muted leading-relaxed line-clamp-3">{inst.bio}</p>
                    )}
                    {/* Links sociais */}
                    {(inst.linkedin || inst.instagram) && (
                      <div className="flex items-center gap-3 mt-2">
                        {inst.linkedin && (
                          <a href={inst.linkedin} target="_blank" rel="noopener noreferrer"
                            className="font-sans text-[10px] text-muted hover:text-primary transition-colors flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> LinkedIn
                          </a>
                        )}
                        {inst.instagram && (
                          <a href={inst.instagram} target="_blank" rel="noopener noreferrer"
                            className="font-sans text-[10px] text-muted hover:text-primary transition-colors flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> Instagram
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative py-24 px-4 overflow-hidden"
        style={{
          backgroundColor: "#FFFFFF",
          backgroundImage: `linear-gradient(rgba(0,71,94,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,71,94,0.06) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}>

        {/* Orbs decorativos */}
        <div aria-hidden className="pointer-events-none absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(circle, rgba(0,71,94,0.4), transparent 70%)" }} />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, rgba(0,71,94,0.5), transparent 70%)" }} />

        <div className="relative max-w-2xl mx-auto text-center">
          {/* Card central com borda gradiente */}
          <div className="relative p-[1px] rounded-3xl"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(0,71,94,0.15) 50%, rgba(255,255,255,0.9) 100%)" }}>
            <div className="relative rounded-3xl py-16 px-8 sm:px-12"
              style={{
                background: "rgba(255,255,255,0.35)",
                backdropFilter: "blur(20px) saturate(160%)",
                WebkitBackdropFilter: "blur(20px) saturate(160%)",
                boxShadow: "0 8px 32px rgba(0,71,94,0.10), inset 0 1px 0 rgba(255,255,255,0.6)",
              }}>

              <h2 className="font-serif text-3xl sm:text-4xl font-light text-primary mb-4">
                {t("cta.title")}
              </h2>
              <p className="font-sans text-base sm:text-lg text-primary/60 mb-10 leading-relaxed max-w-md mx-auto">
                {t("cta.description")}
              </p>
              <Link href="/cursos"
                className="group relative inline-flex items-center gap-2 font-sans text-sm font-semibold px-10 py-4 rounded-full bg-primary text-white transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,71,94,0.4)] hover:scale-[1.03]">
                <span>{t("cta.button")}</span>
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 transition-transform group-hover:translate-x-1">
                  <path fillRule="evenodd" d="M2 8a.5.5 0 01.5-.5h9.293L9.146 4.854a.5.5 0 11.708-.708l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.708-.708L11.793 8.5H2.5A.5.5 0 012 8z" />
                </svg>
                {/* Shimmer no botão */}
                <span className="absolute inset-0 rounded-full overflow-hidden">
                  <span className="absolute inset-0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
