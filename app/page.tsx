import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const courses = [
  {
    slug: "manometria-phmetria-impedancia",
    name: "Manometria, pHmetria e Impedância",
    description:
      "Domine os principais exames de motilidade digestiva: manometria de alta resolução, pHmetria e impedância em ambiente clínico supervisionado.",
    price: "R$ 6.500",
    hours: "16h",
    category: "Hands-On",
    instructorName: "Dr. Felipe Nelson",
    instructorPhoto: "/instructors/felipe-nelson.jpg",
  },
  {
    slug: "manometria-anorretal",
    name: "Manometria Anorretal",
    description:
      "Avaliação funcional do assoalho pélvico e esfíncter anal com manometria de alta resolução, indicações e interpretação clínica.",
    price: "R$ 4.500",
    hours: "12h",
    category: "Hands-On",
    instructorName: "Dra. Eliane Basques",
    instructorPhoto: "/instructors/dra-eliane.jpg",
  },
  {
    slug: "testes-respiratorios",
    name: "Testes Respiratórios",
    description:
      "Espirometria, manovacuometria e curva fluxo-volume com interpretação avançada em módulo online ao vivo.",
    price: "R$ 2.200",
    hours: "8h",
    category: "Online",
    instructorName: "Dra. Vera Ângelo",
    instructorPhoto: "/instructors/dra-vera.jpg",
  },
  {
    slug: "fisioterapia-respiratoria",
    name: "Fisioterapia Respiratória",
    description:
      "Técnicas de reabilitação pulmonar e manejo de pacientes críticos com foco em prática clínica.",
    price: "R$ 3.500",
    hours: "12h",
    category: "Hands-On",
    instructorName: "Dra. Anna Karoline",
    instructorPhoto: "/instructors/anna-karoline.jpg",
  },
];

const instructors = [
  {
    name: "Dra. Vera Ângelo",
    specialty: "Gastroenterologista & Motilidade Digestiva",
    photo: "/instructors/dra-vera.jpg",
  },
  {
    name: "Dra. Eliane Basques",
    specialty: "Especialista em Manometria Anorretal",
    photo: "/instructors/dra-eliane.jpg",
  },
  {
    name: "Dra. Anna Karoline",
    specialty: "Fisioterapeuta Respiratória",
    photo: "/instructors/anna-karoline.jpg",
  },
  {
    name: "Dr. Felipe Nelson",
    specialty: "Motilidade Digestiva, pHmetria e Impedância",
    photo: "/instructors/felipe-nelson.jpg",
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

      {/* Hero — teal muito escuro */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 pt-28 pb-32 overflow-hidden bg-canvas">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(203,228,230,0.1) 0%, transparent 70%)",
          }}
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]"
        >
          <Image
            src="/icone-nuvem.svg"
            alt=""
            width={900}
            height={643}
            className="w-[140%] max-w-none"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </div>

        <span className="relative font-sans text-xs font-semibold tracking-[0.25em] uppercase text-accent mb-6 opacity-80">
          Plataforma de Formação Médica
        </span>

        <h1 className="relative font-serif text-5xl sm:text-6xl lg:text-7xl font-light text-white leading-tight max-w-3xl mb-6">
          Formação Médica de{" "}
          <em className="not-italic italic text-accent font-medium">
            Excelência
          </em>
        </h1>

        <p className="relative font-sans text-base sm:text-lg text-white/60 max-w-xl leading-relaxed mb-10">
          Cursos hands-on e online desenvolvidos por especialistas, para
          profissionais de saúde que buscam dominar procedimentos clínicos com
          rigor científico.
        </p>

        <div className="relative flex flex-col sm:flex-row gap-4 items-center">
          <Link
            href="/cursos"
            className="font-sans text-sm font-semibold px-8 py-3.5 rounded-full bg-accent text-accent-foreground hover:bg-accent-light transition-colors"
          >
            Ver Cursos
          </Link>
          <Link
            href="/sobre"
            className="font-sans text-sm font-semibold px-8 py-3.5 rounded-full border border-accent text-accent hover:bg-accent/10 transition-colors"
          >
            Conheça a Plataforma
          </Link>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(203,228,230,0.3), transparent)" }}
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
                className="group flex flex-col gap-5 p-8 rounded-2xl bg-surface border border-border hover:border-primary/40 hover:shadow-sm transition-all duration-300"
              >
                <span className="text-primary group-hover:text-primary-light transition-colors">
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
                <span className="font-sans text-xs font-semibold text-primary group-hover:text-primary-light transition-colors tracking-wider uppercase">
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
              className="font-sans text-xs font-semibold text-primary hover:text-primary-light transition-colors tracking-wider uppercase shrink-0"
            >
              Ver todos →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {courses.map((course) => (
              <div
                key={course.slug}
                className="flex flex-col rounded-2xl bg-surface border border-border overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-300"
              >
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={course.instructorPhoto}
                    alt={course.instructorName}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-4 font-sans text-[10px] font-semibold uppercase tracking-widest text-white bg-primary/80 px-2.5 py-1 rounded-full">
                    {course.category}
                  </span>
                </div>

                <div className="flex flex-col flex-1 p-6 gap-4">
                  <div>
                    <p className="font-sans text-[11px] text-muted mb-1">
                      {course.instructorName}
                    </p>
                    <h3 className="font-serif text-xl font-medium text-foreground leading-snug">
                      {course.name}
                    </h3>
                  </div>

                  <p className="font-sans text-xs text-muted leading-relaxed flex-1">
                    {course.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex flex-col">
                      <span className="font-serif text-xl font-semibold text-primary">
                        {course.price}
                      </span>
                      <span className="font-sans text-[10px] text-muted/70 tracking-wide">
                        {course.hours} de formação
                      </span>
                    </div>
                    <Link
                      href={`/cursos/${course.slug}`}
                      className="font-sans text-xs font-semibold px-4 py-2 rounded-full border border-primary text-primary hover:bg-primary hover:text-white transition-all"
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

      {/* Instrutores — fundo claro */}
      <section className="bg-background py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-foreground mb-3">
            Corpo Docente
          </h2>
          <p className="font-sans text-sm text-muted mb-14">
            Especialistas com trajetória clínica e acadêmica de referência
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {instructors.map((instructor) => (
              <div key={instructor.name} className="flex flex-col items-center gap-4">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 shrink-0">
                  <Image
                    src={instructor.photo}
                    alt={instructor.name}
                    fill
                    className="object-cover object-top"
                    sizes="96px"
                  />
                </div>
                <div>
                  <p className="font-serif text-base font-medium text-foreground leading-tight">
                    {instructor.name}
                  </p>
                  <p className="font-sans text-xs text-muted mt-1 leading-snug">
                    {instructor.specialty}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final — fundo teal primário */}
      <section className="bg-canvas-light py-20 px-4 text-center">
        <div
          className="max-w-2xl mx-auto py-16 px-8 rounded-3xl border border-canvas-border"
          style={{
            background:
              "radial-gradient(ellipse 100% 120% at 50% 50%, rgba(203,228,230,0.08) 0%, transparent 70%)",
          }}
        >
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mb-4">
            Pronto para evoluir na sua carreira?
          </h2>
          <p className="font-sans text-sm text-white/60 mb-8 leading-relaxed">
            Junte-se a centenas de profissionais de saúde que já transformaram
            sua prática clínica com a Nuvem Ensino.
          </p>
          <Link
            href="/cursos"
            className="inline-block font-sans text-sm font-semibold px-10 py-4 rounded-full bg-accent text-accent-foreground hover:bg-accent-light transition-colors"
          >
            Começar agora
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
