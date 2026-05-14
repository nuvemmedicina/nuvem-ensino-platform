import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const courses = [
  {
    slug: "manometria-esofagica",
    name: "Manometria Esofágica",
    description:
      "Domine a interpretação e realização de manometria de alta resolução em ambiente clínico supervisionado.",
    price: "R$ 6.500",
    hours: "16h",
    category: "Hands-On",
  },
  {
    slug: "testes-respiratorios",
    name: "Testes Respiratórios",
    description:
      "Espirometria, manovacuometria e curva fluxo-volume com interpretação avançada em módulo online ao vivo.",
    price: "R$ 2.200",
    hours: "8h",
    category: "Online",
  },
  {
    slug: "fisioterapia-respiratoria",
    name: "Fisioterapia Respiratória",
    description:
      "Técnicas de reabilitação pulmonar e manejo de pacientes críticos com foco em prática clínica.",
    price: "R$ 3.500",
    hours: "12h",
    category: "Hands-On",
  },
];

const instructors = [
  {
    name: "Dra. Ana Beatriz Lemos",
    specialty: "Gastroenterologista & Endoscopista",
    initials: "AL",
  },
  {
    name: "Dra. Camila Vieira",
    specialty: "Pneumologista Clínica",
    initials: "CV",
  },
  {
    name: "Dra. Fernanda Rocha",
    specialty: "Fisioterapeuta Respiratória",
    initials: "FR",
  },
];

const categories = [
  {
    label: "Hands-On",
    href: "/cursos?categoria=hands-on",
    description:
      "Treinamento presencial em ambiente controlado com equipamentos reais e supervisão especializada.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
  },
  {
    label: "Online",
    href: "/cursos?categoria=online",
    description:
      "Aulas ao vivo e gravadas com acesso flexível, material didático e certificação reconhecida.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-full bg-background">
      <Header />

      {/* Hero — fundo escuro */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 pt-28 pb-32 overflow-hidden bg-canvas">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,169,110,0.12) 0%, transparent 70%)",
          }}
        />

        <span className="font-sans text-xs font-semibold tracking-[0.25em] uppercase text-gold mb-6 opacity-80">
          Plataforma de Formação Médica
        </span>

        <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light text-white leading-tight max-w-3xl mb-6">
          Formação Médica de{" "}
          <em className="not-italic italic text-gold font-medium">
            Excelência
          </em>
        </h1>

        <p className="font-sans text-base sm:text-lg text-white/60 max-w-xl leading-relaxed mb-10">
          Cursos hands-on e online desenvolvidos por especialistas, para
          profissionais de saúde que buscam dominar procedimentos clínicos com
          rigor científico.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link
            href="/cursos"
            className="font-sans text-sm font-semibold px-8 py-3.5 rounded-full bg-gold text-canvas hover:bg-gold-light transition-colors"
          >
            Ver Cursos
          </Link>
          <Link
            href="/sobre"
            className="font-sans text-sm font-semibold px-8 py-3.5 rounded-full border border-gold text-gold hover:bg-gold/10 transition-colors"
          >
            Conheça a Plataforma
          </Link>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.3), transparent)" }}
        />
      </section>

      {/* Modalidades — fundo claro */}
      <section className="bg-background py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-foreground text-center mb-3">
            Modalidades de Ensino
          </h2>
          <p className="font-sans text-sm text-muted text-center mb-12">
            Escolha o formato que melhor se adapta à sua rotina
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="group flex flex-col gap-5 p-8 rounded-2xl bg-surface border border-border hover:border-gold/60 hover:shadow-sm transition-all duration-300"
              >
                <span className="text-gold group-hover:text-gold-dark transition-colors">
                  {cat.icon}
                </span>
                <div>
                  <h3 className="font-serif text-2xl font-medium text-foreground mb-2">
                    {cat.label}
                  </h3>
                  <p className="font-sans text-sm text-muted leading-relaxed">
                    {cat.description}
                  </p>
                </div>
                <span className="font-sans text-xs font-semibold text-gold group-hover:text-gold-dark transition-colors tracking-wider uppercase">
                  Explorar cursos →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Cursos em Destaque — fundo claro */}
      <section className="bg-background py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-foreground mb-2">
                Cursos em Destaque
              </h2>
              <p className="font-sans text-sm text-muted">
                Formações de alto impacto para a sua prática clínica
              </p>
            </div>
            <Link
              href="/cursos"
              className="font-sans text-xs font-semibold text-gold hover:text-gold-dark transition-colors tracking-wider uppercase shrink-0"
            >
              Ver todos →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.slug}
                className="flex flex-col rounded-2xl bg-surface border border-border overflow-hidden hover:border-gold/50 hover:shadow-md transition-all duration-300"
              >
                <div
                  className="h-40 flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(201,169,110,0.18) 0%, rgba(245,240,232,0.6) 100%)",
                  }}
                >
                  <span className="font-serif text-5xl text-gold/40 font-light select-none">
                    {course.name.charAt(0)}
                  </span>
                </div>

                <div className="flex flex-col flex-1 p-6 gap-4">
                  <div>
                    <span className="font-sans text-[10px] font-semibold uppercase tracking-widest text-gold mb-2 block">
                      {course.category}
                    </span>
                    <h3 className="font-serif text-xl font-medium text-foreground leading-snug">
                      {course.name}
                    </h3>
                  </div>

                  <p className="font-sans text-xs text-muted leading-relaxed flex-1">
                    {course.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex flex-col">
                      <span className="font-serif text-xl font-semibold text-gold">
                        {course.price}
                      </span>
                      <span className="font-sans text-[10px] text-muted/70 tracking-wide">
                        {course.hours} de formação
                      </span>
                    </div>
                    <Link
                      href={`/cursos/${course.slug}`}
                      className="font-sans text-xs font-semibold px-4 py-2 rounded-full border border-gold text-gold hover:bg-gold hover:text-canvas transition-all"
                    >
                      Saiba mais
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instrutoras — fundo claro */}
      <section className="bg-background py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-foreground mb-3">
            Corpo Docente
          </h2>
          <p className="font-sans text-sm text-muted mb-14">
            Especialistas com trajetória clínica e acadêmica de referência
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {instructors.map((instructor) => (
              <div key={instructor.name} className="flex flex-col items-center gap-4">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-gold font-serif text-2xl font-medium border border-gold/30"
                  style={{ background: "rgba(201,169,110,0.1)" }}
                >
                  {instructor.initials}
                </div>
                <div>
                  <p className="font-serif text-lg font-medium text-foreground">
                    {instructor.name}
                  </p>
                  <p className="font-sans text-xs text-muted mt-1">
                    {instructor.specialty}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final — fundo escuro */}
      <section className="bg-canvas-light py-20 px-4 text-center">
        <div
          className="max-w-2xl mx-auto py-16 px-8 rounded-3xl border border-canvas-border"
          style={{
            background:
              "radial-gradient(ellipse 100% 120% at 50% 50%, rgba(201,169,110,0.08) 0%, transparent 70%)",
          }}
        >
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mb-4">
            Pronto para evoluir na sua carreira?
          </h2>
          <p className="font-sans text-sm text-white/50 mb-8 leading-relaxed">
            Junte-se a centenas de profissionais de saúde que já transformaram
            sua prática clínica com a Nuvem Ensino.
          </p>
          <Link
            href="/cursos"
            className="inline-block font-sans text-sm font-semibold px-10 py-4 rounded-full bg-gold text-canvas hover:bg-gold-light transition-colors"
          >
            Começar agora
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
