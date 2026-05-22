import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  return {
    title: `NU.V.E.M Ensino — ${t("hero.title")} ${t("hero.titleHighlight")}`,
    description:
      locale === "pt"
        ? "Plataforma de formação médica com cursos hands-on e online de Gastroenterologia, Motilidade Digestiva, Testes Respiratórios e Fisioterapia Pélvica. Certificação ISO 9001 em Belo Horizonte, MG."
        : locale === "en"
          ? "Medical education platform with hands-on and online courses in Gastroenterology, Digestive Motility, Breath Tests and Pelvic Physiotherapy. ISO 9001 certified in Belo Horizonte, MG."
          : "Plataforma de formación médica con cursos prácticos y en línea en Gastroenterología, Motilidad Digestiva, Pruebas Respiratorias y Fisioterapia Pélvica. Certificación ISO 9001 en Belo Horizonte, MG.",
    alternates: {
      canonical: locale === "en" ? "/en/" : locale === "es" ? "/es/" : "/",
      languages: { pt: "/", en: "/en/", es: "/es/", "x-default": "/" },
    },
    openGraph: {
      title: `NU.V.E.M Ensino — ${t("hero.title")} ${t("hero.titleHighlight")}`,
      description: t("hero.description"),
      url: locale === "en" ? "/en/" : locale === "es" ? "/es/" : "/",
      type: "website",
      locale: locale === "en" ? "en_US" : locale === "es" ? "es_ES" : "pt_BR",
    },
  };
}

const courses = [
  {
    slug: "manometria-phmetria-impedancia",
    name: "Manometria, pHmetria e Impedância",
    description: "Domine os principais exames de motilidade digestiva: manometria de alta resolução, pHmetria e impedância em ambiente clínico supervisionado.",
    price: "R$ 6.500",
    hours: "40",
    category: "Hands-On",
    instructorName: "Dr. Felipe Nelson",
    instructorPhoto: "/instructors/felipe-nelson.jpg",
  },
  {
    slug: "testes-respiratorios-h2-ch4-h2s-junho",
    name: "Testes Respiratórios de H₂, CH₄ e H₂S",
    description: "Turma de Junho: formação presencial com teoria e prática supervisionada em testes respiratórios nos dias 19 e 20 de junho de 2026.",
    price: "R$ 2.200",
    hours: "8",
    category: "Hands-On",
    instructorName: "Dra. Vera Ângelo",
    instructorPhoto: "/instructors/dra-vera.jpg",
  },
  {
    slug: "fisioterapia-respiratoria",
    name: "Fisioterapia nas Disfunções do Assoalho Pélvico",
    description: "Treinamento teórico-prático em fisioterapia pélvica: avaliação, tratamento e prática supervisionada com Dra. Anna Karoline.",
    price: "R$ 3.500",
    hours: "30",
    category: "Hands-On",
    instructorName: "Dra. Anna Karoline",
    instructorPhoto: "/instructors/anna-karoline.jpg",
  },
];

const instructors = [
  {
    name: "Dra. Vera Ângelo",
    specialty: "Gastroenterologia · Motilidade Digestiva",
    crm: "CRM-MG 22284",
    bio: "Diretora técnica da NU.V.E.M Medicina, referência nacional em testes respiratórios e motilidade digestiva. Doutora pela UFMG e professora convidada do Hospital Israelita Albert Einstein.",
    photo: "/instructors/dra-vera.jpg",
    slug: "dra-vera-angelo",
  },
  {
    name: "Dra. Eliane Basques",
    specialty: "Gastroenterologia · Manometria Anorretal",
    crm: "CRM-MG 27601",
    bio: "Cirurgiã Pediatra e especialista em manometria anorretal de alta resolução. Sócia proprietária da Clínica NU.V.E.M Medicina em Belo Horizonte.",
    photo: "/instructors/dra-eliane.jpg",
    slug: "dra-eliane-basques",
  },
  {
    name: "Dra. Anna Karoline",
    specialty: "Fisioterapia Pélvica",
    crm: "",
    bio: "Fisioterapeuta especialista em disfunções do assoalho pélvico. Doutoranda pela UNICAMP, alia rigor científico e experiência clínica na formação de profissionais.",
    photo: "/instructors/anna-karoline.jpg",
    slug: "dra-anna-karoline",
  },
  {
    name: "Dr. Felipe Nelson",
    specialty: "Gastroenterologia · Motilidade Digestiva",
    crm: "CRM-MG",
    bio: "Gastroenterologista pela USP-Ribeirão Preto, doutor pela USP. Especialista em manometria esofágica de alta resolução, pHmetria e impedancio-pHmetria, com anos de experiência clínica.",
    photo: "/instructors/felipe-nelson.jpg",
    slug: "dr-felipe-nelson",
  },
];

const stats = [
  { value: "+500", label: "Médicos formados" },
  { value: "6",    label: "Cursos especializados" },
  { value: "ISO 9001", label: "Certificação de qualidade" },
  { value: "10+", label: "Anos de experiência" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": "https://nuvemensino.com.br/#organization",
      name: "NU.V.E.M Ensino",
      url: "https://nuvemensino.com.br",
      logo: "https://nuvemensino.com.br/logo.png",
      description: "Plataforma de formação médica especializada em Gastroenterologia, Motilidade Digestiva e Fisioterapia Pélvica. Certificação ISO 9001.",
      address: { "@type": "PostalAddress", addressLocality: "Belo Horizonte", addressRegion: "MG", addressCountry: "BR" },
    },
    {
      "@type": "WebSite",
      "@id": "https://nuvemensino.com.br/#website",
      url: "https://nuvemensino.com.br",
      name: "NU.V.E.M Ensino",
    },
  ],
};

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  const modalities = [
    {
      label: "Hands-On",
      href: "/cursos" as const,
      description: t("modalities.handsOnDescription"),
      accentColor: "from-teal-500/20 to-transparent",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
        </svg>
      ),
    },
    {
      label: "Online",
      href: "/cursos" as const,
      description: t("modalities.onlineDescription"),
      accentColor: "from-blue-500/20 to-transparent",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col min-h-full bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 pt-28 pb-0 overflow-hidden bg-canvas">

        {/* Grid de fundo */}
        <div aria-hidden className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(203,228,230,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(203,228,230,0.06) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Orb esquerdo */}
        <div aria-hidden className="pointer-events-none absolute -left-32 top-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(0,71,94,0.8) 0%, transparent 70%)" }}
        />
        {/* Orb direito */}
        <div aria-hidden className="pointer-events-none absolute -right-24 top-1/3 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(203,228,230,0.6) 0%, transparent 70%)" }}
        />

        {/* Selo ISO decorativo */}
        <div aria-hidden className="pointer-events-none absolute -right-16 top-1/2 -translate-y-1/2 opacity-[0.05]">
          <Image src="/selo-iso-9001.png" alt="" width={520} height={520} className="w-[420px] sm:w-[520px]" />
        </div>

        {/* Badge */}
        <div className="relative flex items-center gap-2 mb-7">
          <span className="animate-dot w-1.5 h-1.5 rounded-full bg-accent block" />
          <span className="font-sans text-xs font-semibold tracking-[0.25em] uppercase text-accent/80">
            {t("hero.badge")}
          </span>
        </div>

        {/* Título */}
        <h1 className="relative font-serif text-5xl sm:text-6xl lg:text-7xl font-light text-white leading-tight max-w-3xl mb-6">
          {t("hero.title")}{" "}
          <em className="not-italic italic font-medium"
            style={{ background: "linear-gradient(135deg, #CBE4E6 0%, #7BC5CA 50%, #CBE4E6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            {t("hero.titleHighlight")}
          </em>
        </h1>

        <p className="relative font-sans text-base sm:text-lg text-white/55 max-w-xl leading-relaxed mb-10">
          {t("hero.description")}
        </p>

        {/* CTAs */}
        <div className="relative flex flex-col sm:flex-row gap-4 items-center mb-16">
          <Link href="/cursos"
            className="group relative font-sans text-sm font-semibold px-8 py-3.5 rounded-full bg-accent text-accent-foreground transition-all duration-300 hover:shadow-[0_0_32px_rgba(203,228,230,0.4)] hover:scale-[1.03]">
            {t("hero.cta")}
            <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.15), transparent)" }} />
          </Link>
          <Link href="/sobre"
            className="font-sans text-sm font-semibold px-8 py-3.5 rounded-full border border-accent/40 text-accent hover:border-accent hover:bg-accent/10 transition-all duration-300">
            {t("hero.ctaSecondary")}
          </Link>
        </div>

        {/* Stats strip */}
        <div className="relative w-full max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-white/8">
            {stats.map((s, i) => (
              <div key={s.label}
                className={`flex flex-col items-center justify-center py-6 px-4 ${i < stats.length - 1 ? "border-r border-white/8" : ""}`}>
                <span className="font-serif text-2xl sm:text-3xl font-semibold text-white">{s.value}</span>
                <span className="font-sans text-[11px] text-white/40 mt-1 text-center leading-tight">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modalidades ──────────────────────────────────────────────────── */}
      <section className="bg-background py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-foreground mb-3">
              {t("modalities.title")}
            </h2>
            <p className="font-sans text-sm text-muted">{t("modalities.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {modalities.map((cat) => (
              <Link key={cat.label} href={cat.href}
                className="shimmer-card group relative flex flex-col gap-6 p-8 rounded-2xl bg-surface border border-border overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-[0_8px_32px_rgba(0,71,94,0.12)]">

                {/* Gradient reveal no hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                {/* Borda luminosa inferior */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Ícone */}
                <div className="relative w-11 h-11 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center text-primary group-hover:bg-primary/15 group-hover:border-primary/30 group-hover:scale-110 transition-all duration-300">
                  {cat.icon}
                </div>

                <div className="relative flex-1">
                  <h3 className="font-serif text-2xl font-medium text-foreground mb-2 group-hover:text-primary transition-colors duration-200">
                    {cat.label}
                  </h3>
                  <p className="font-sans text-sm text-muted leading-relaxed">{cat.description}</p>
                </div>

                <div className="relative flex items-center gap-2 font-sans text-xs font-semibold text-primary tracking-wider uppercase">
                  <span>{t("modalities.explore")}</span>
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1.5">
                    <path fillRule="evenodd" d="M2 8a.5.5 0 01.5-.5h9.293L9.146 4.854a.5.5 0 11.708-.708l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.708-.708L11.793 8.5H2.5A.5.5 0 012 8z" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cursos em Destaque ───────────────────────────────────────────── */}
      <section className="bg-background py-4 pb-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-foreground mb-2">
                {t("featured.title")}
              </h2>
              <p className="font-sans text-sm text-muted">{t("featured.subtitle")}</p>
            </div>
            <Link href="/cursos"
              className="group inline-flex items-center gap-2 font-sans text-xs font-semibold text-primary hover:text-primary-light tracking-wider uppercase shrink-0 transition-colors">
              {t("featured.viewAll")}
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1">
                <path fillRule="evenodd" d="M2 8a.5.5 0 01.5-.5h9.293L9.146 4.854a.5.5 0 11.708-.708l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.708-.708L11.793 8.5H2.5A.5.5 0 012 8z" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.slug}
                className="shimmer-card group flex flex-col rounded-2xl bg-surface border border-border overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_16px_48px_rgba(0,71,94,0.15)] hover:border-primary/40">

                {/* Imagem */}
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={course.instructorPhoto}
                    alt={course.instructorName}
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {/* Overlay que escurece levemente no hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-300" />
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300" />

                  {/* Badge categoria */}
                  <span className="absolute bottom-3 left-4 font-sans text-[10px] font-bold uppercase tracking-widest text-white/90 bg-primary/70 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10 group-hover:bg-primary/90 transition-colors">
                    {course.category}
                  </span>
                </div>

                <div className="flex flex-col flex-1 p-6 gap-4">
                  <div>
                    <p className="font-sans text-[11px] text-muted/70 mb-1.5 tracking-wide">{course.instructorName}</p>
                    <h3 className="font-serif text-xl font-medium text-foreground leading-snug group-hover:text-primary transition-colors duration-200">
                      {course.name}
                    </h3>
                  </div>

                  <p className="font-sans text-xs text-muted leading-relaxed flex-1">{course.description}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <span className="font-serif text-xl font-semibold text-primary">{course.price}</span>
                      <p className="font-sans text-[10px] text-muted/60 mt-0.5">
                        {t("featured.training", { hours: course.hours })}
                      </p>
                    </div>
                    <Link
                      href={{ pathname: "/cursos/[slug]", params: { slug: course.slug } }}
                      className="font-sans text-xs font-semibold px-4 py-2 rounded-full border border-primary text-primary hover:bg-primary hover:text-white hover:shadow-[0_4px_14px_rgba(0,71,94,0.3)] transition-all duration-200">
                      {t("featured.learnMore")}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Instrutores ──────────────────────────────────────────────────── */}
      <section className="relative bg-canvas py-24 px-4 overflow-hidden">
        {/* Nuvem decorativa */}
        <div aria-hidden className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-[0.04] w-[600px]">
          <Image src="/icone-nuvem.svg" alt="" width={600} height={428} className="w-full h-auto" />
        </div>
        {/* Orb decorativo */}
        <div aria-hidden className="pointer-events-none absolute left-1/4 -bottom-20 w-64 h-64 rounded-full blur-3xl opacity-10"
          style={{ background: "radial-gradient(circle, rgba(203,228,230,0.8), transparent 70%)" }} />

        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-14">
            <span className="font-sans text-xs font-semibold tracking-[0.25em] uppercase text-accent/80 mb-4 block">
              {t("instructors.badge")}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mb-3">
              {t("instructors.title")}
            </h2>
            <p className="font-sans text-sm text-white/45 max-w-xl mx-auto">
              {t("instructors.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {instructors.map((instructor) => (
              <Link key={instructor.name} href="/instrutores"
                className="group flex gap-5 rounded-2xl p-5 border border-white/8 bg-white/[0.03] hover:bg-white/[0.07] hover:border-accent/20 transition-all duration-300 hover:-translate-y-0.5">

                {/* Foto com anel luminoso */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/10 group-hover:ring-accent/30 transition-all duration-300">
                  <Image
                    src={instructor.photo}
                    alt={instructor.name}
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    sizes="96px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent group-hover:from-black/10 transition-all duration-300" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Linha accent no hover */}
                  <div className="w-0 group-hover:w-8 h-0.5 bg-accent mb-2 transition-all duration-300 rounded-full" />
                  <p className="font-serif text-base sm:text-lg font-medium text-white leading-tight">
                    {instructor.name}
                  </p>
                  <p className="font-sans text-xs text-accent font-semibold mt-0.5 mb-2">
                    {instructor.specialty}
                  </p>
                  {instructor.crm && (
                    <p className="font-sans text-[10px] text-white/25 mb-2">{instructor.crm}</p>
                  )}
                  <p className="font-sans text-xs text-white/45 leading-relaxed line-clamp-2">
                    {instructor.bio}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/instrutores"
              className="group inline-flex items-center gap-2 font-sans text-sm font-semibold text-white/50 hover:text-white transition-colors duration-200">
              {t("instructors.viewProfiles")}
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 transition-transform group-hover:translate-x-1">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA Final ────────────────────────────────────────────────────── */}
      <section className="relative py-24 px-4 overflow-hidden"
        style={{
          backgroundColor: "#CBE4E6",
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
            style={{ background: "linear-gradient(135deg, rgba(0,71,94,0.4) 0%, rgba(0,71,94,0.1) 50%, rgba(0,71,94,0.4) 100%)" }}>
            <div className="relative rounded-3xl py-16 px-8 sm:px-12"
              style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(12px)" }}>

              <h2 className="font-serif text-3xl sm:text-4xl font-light text-primary mb-4">
                {t("cta.title")}
              </h2>
              <p className="font-sans text-sm text-primary/60 mb-10 leading-relaxed max-w-md mx-auto">
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
