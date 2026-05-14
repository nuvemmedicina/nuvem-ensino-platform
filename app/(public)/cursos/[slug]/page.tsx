import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Clock,
  Users,
  MapPin,
  CheckCircle,
  Calendar,
  BookOpen,
  Award,
  ChevronRight,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

// Rich static content (objectives, modules, audience) not yet in DB
const staticContent: Record<
  string,
  {
    objectives: string[];
    targetAudience: string[];
    modules: { title: string; lessons: string[] }[];
    includes: string[];
    instructorBio: string;
    startDate: string | null;
  }
> = {
  "manometria-phmetria-impedancia": {
    instructorBio:
      "Dr. Felipe Nelson é referência nacional em exames de motilidade digestiva, com mais de 10 anos de experiência em manometria de alta resolução, pHmetria e impedância esofágica. Formado pela UFMG com residência em Gastroenterologia.",
    startDate: "A definir",
    objectives: [
      "Realizar manometria esofágica de alta resolução com autonomia",
      "Interpretar laudos de pHmetria de 24 horas e impedancio-pHmetria",
      "Identificar padrões de motilidade e classificá-los segundo Chicago v4.0",
      "Correlacionar achados funcionais com quadro clínico do paciente",
      "Manejar equipamentos Sandhill e Medtronic",
    ],
    targetAudience: [
      "Gastroenterologistas",
      "Cirurgiões do esôfago",
      "Médicos em especialização em Gastroenterologia",
      "Nutrólogos e clínicos com interesse em funcional digestiva",
    ],
    modules: [
      {
        title: "Módulo 1 — Fundamentos",
        lessons: [
          "Anatomia e fisiologia da motilidade esofágica",
          "Indicações, contraindicações e preparo do paciente",
          "Classificação de Chicago v4.0",
        ],
      },
      {
        title: "Módulo 2 — Manometria na Prática",
        lessons: [
          "Montagem do equipamento e cateter",
          "Realização do exame supervisionado",
          "Interpretação e laudo em tempo real",
        ],
      },
      {
        title: "Módulo 3 — pHmetria e Impedância",
        lessons: [
          "Fundamentos de pHmetria esofágica",
          "Impedancio-pHmetria: posicionamento e análise",
          "Interpretação de laudos e correlação clínica",
        ],
      },
      {
        title: "Módulo 4 — Casos Clínicos",
        lessons: [
          "Revisão de 20 laudos reais",
          "Discussão multidisciplinar",
          "Avaliação e emissão de certificado",
        ],
      },
    ],
    includes: [
      "16h de treinamento presencial supervisionado",
      "Material didático impresso e digital",
      "Acesso a biblioteca de laudos comentados",
      "Certificado digital com QR Code",
      "Coffee break nos dois dias",
      "Suporte pós-curso por 30 dias via grupo exclusivo",
    ],
  },
  "manometria-anorretal": {
    instructorBio:
      "Dra. Eliane Basques é especialista em fisiologia anorretal com ampla experiência em manometria de alta resolução e ultrassonografia endoanal. Professora convidada em diversos congressos nacionais de Coloproctologia.",
    startDate: "A definir",
    objectives: [
      "Dominar a técnica de manometria anorretal de alta resolução",
      "Interpretar perfis de pressão e reflexo retoanal",
      "Diagnosticar incontinência fecal, constipação funcional e dissinergias",
      "Correlacionar achados com biofeedback e tratamento conservador",
    ],
    targetAudience: [
      "Coloproctologistas",
      "Gastroenterologistas",
      "Fisioterapeutas pélvicos",
      "Ginecologistas com interesse em assoalho pélvico",
    ],
    modules: [
      {
        title: "Módulo 1 — Bases da Fisiologia Anorretal",
        lessons: [
          "Anatomia e neurofisiologia do assoalho pélvico",
          "Indicações e contraindicações",
          "Preparo e posicionamento do paciente",
        ],
      },
      {
        title: "Módulo 2 — Técnica e Prática",
        lessons: [
          "Calibração e montagem do cateter",
          "Realização do exame supervisionado",
          "Protocolos de pressão e sensação retal",
        ],
      },
      {
        title: "Módulo 3 — Interpretação e Laudos",
        lessons: [
          "Análise de traçados de alta resolução",
          "Laudos comentados e diagnósticos diferenciais",
          "Integração com outros exames funcionais",
        ],
      },
    ],
    includes: [
      "12h de treinamento presencial supervisionado",
      "Material didático digital",
      "Acesso a atlas de laudos comentados",
      "Certificado digital com QR Code",
      "Coffee break",
      "Grupo de suporte pós-curso",
    ],
  },
  "testes-respiratorios": {
    instructorBio:
      "Dra. Vera Ângelo é diretora técnica da Nuvem Medicina e referência nacional em motilidade digestiva e testes respiratórios. Especialista em Gastroenterologia pela UFMG, conduz pesquisa clínica aplicada em teste respiratório de hidrogênio e metano há mais de uma década.",
    startDate: null,
    objectives: [
      "Dominar os novos protocolos de teste respiratório de hidrogênio e metano",
      "Interpretar laudos com precisão e correlacionar com quadro clínico",
      "Compreender e aplicar os últimos guidelines internacionais",
      "Analisar casos clínicos desafiadores com raciocínio diagnóstico avançado",
    ],
    targetAudience: [
      "Médicos gastroenterologistas",
      "Clínicos gerais e internistas",
      "Nutrólogos e nutricionistas clínicos",
      "Profissionais de saúde com interesse em diagnóstico funcional digestivo",
    ],
    modules: [
      {
        title: "Teste Respiratório – Novos Protocolos",
        lessons: [
          "Introdução para prática de Teste Respiratório",
          "Vivendo a experiência prática de exames",
          "Interpretação de laudos realizados na prática",
          "Desvendando novos Guidelines de Teste Respiratório",
          "Casos clínicos desafiadores",
        ],
      },
    ],
    includes: [
      "3h15min de aula gravada com acesso imediato",
      "5 aulas práticas com casos clínicos reais",
      "Certificado de participação com nota fiscal",
      "Acesso ao conteúdo por tempo indeterminado",
      "Material de apoio em PDF",
    ],
  },
  "testes-respiratorios-h2-ch4-h2s-junho": {
    instructorBio:
      "Dra. Vera Ângelo é diretora técnica da Nuvem Medicina e referência nacional em motilidade digestiva e testes respiratórios. Mestre e Doutora em Patologia pela UFMG, pioneira na aplicação dos novos protocolos de H₂/CH₄/H₂S no Brasil e professora convidada do Albert Einstein.",
    startDate: "19–20 de junho de 2026",
    objectives: [
      "Diagnosticar intolerâncias alimentares (lactose, frutose, frutanas, sacarose) com precisão",
      "Identificar e diferenciar SIBO, IMO, LIBO e SIFO pelos critérios atualizados",
      "Operar com autonomia os equipamentos Dynamed e Health Go",
      "Elaborar e interpretar laudos de testes respiratórios de H₂, CH₄ e H₂S",
      "Implantar ou aprimorar um serviço de testes respiratórios na sua clínica",
      "Aplicar as atualizações do DDW 2025 na prática clínica",
    ],
    targetAudience: [
      "Médicos que desejam implantar testes respiratórios na clínica",
      "Gastroenterologistas e clínicos gerais",
      "Nutrólogos e nutricionistas clínicos",
      "Profissionais interessados em diagnóstico funcional digestivo",
    ],
    modules: [
      {
        title: "Dia 1 (19/06) — Módulo Teórico · 14h–18h",
        lessons: [
          "Intolerâncias alimentares: lactose, frutose, frutanas e sacarose",
          "SIBO, IMO, LIBO e SIFO — diagnóstico e critérios atualizados",
          "Atualizações DDW 2025 — novos protocolos e guidelines",
        ],
      },
      {
        title: "Dia 2 (20/06) — Teoria + Prática Supervisionada · 8h–17h30",
        lessons: [
          "Como estruturar e implantar um serviço de testes respiratórios",
          "Prática supervisionada: equipamento Dynamed",
          "Prática supervisionada: equipamento Health Go",
          "Elaboração e interpretação de laudos — casos reais",
        ],
      },
    ],
    includes: [
      "8h de treinamento teórico-prático (19 e 20 de junho de 2026)",
      "Prática supervisionada com equipamentos Dynamed e Health Go",
      "Material didático completo",
      "Coffee break e almoço incluídos",
      "Certificado de conclusão",
      "Atualizações DDW 2025",
    ],
  },
  "desvendando-a-constipacao-intestinal": {
    instructorBio:
      "Dra. Vera Ângelo é diretora técnica da Nuvem Medicina e referência nacional em motilidade digestiva. Junto com a Dra. Eliane Basques — cirurgiã pediátrica especialista em manometria anorretal de alta resolução — apresenta uma abordagem completa e baseada em evidências para o diagnóstico da constipação intestinal.",
    startDate: null,
    objectives: [
      "Aplicar corretamente os critérios Roma IV no diagnóstico da constipação",
      "Interpretar o tempo de trânsito colônico e seus padrões",
      "Correlacionar achados de manometria anorretal com o quadro clínico",
      "Elaborar planos de tratamento individualizados baseados nos exames",
      "Diferenciar constipação funcional de dissinergias do assoalho pélvico",
    ],
    targetAudience: [
      "Gastroenterologistas e coloproctologistas",
      "Clínicos gerais e internistas",
      "Fisioterapeutas pélvicos",
      "Médicos em formação com interesse em funcional digestiva",
    ],
    modules: [
      {
        title: "Desvendando a Constipação Intestinal",
        lessons: [
          "Classificação Roma IV — critérios diagnósticos atualizados",
          "Tempo de trânsito colônico: como solicitar e interpretar",
          "Manometria anorretal na constipação: padrões e achados",
          "Correlação clínica e plano de tratamento individualizado",
        ],
      },
    ],
    includes: [
      "3h de aula gravada com acesso imediato",
      "Ministrado por Dra. Vera Ângelo e Dra. Eliane Basques",
      "Certificado de participação",
      "Nota fiscal para declaração de imposto de renda",
      "Acesso ao conteúdo por tempo indeterminado",
    ],
  },
  "fisioterapia-respiratoria": {
    instructorBio:
      "Dra. Karol Rocha é fisioterapeuta formada pela PUC-MG, mestre em Ciências da Reabilitação pela UNIFAL-MG e doutoranda pela UNICAMP. Especializada no tratamento de disfunções do assoalho pélvico, alia rigor científico e experiência clínica para oferecer formação de alto nível a profissionais de saúde.",
    startDate: "17–19 de junho de 2026",
    objectives: [
      "Dominar a anatomia detalhada e a biomecânica do assoalho pélvico",
      "Realizar avaliação clínica e instrumental com assertividade",
      "Aplicar estratégias terapêuticas baseadas em evidências atuais",
      "Analisar casos clínicos reais e discutir atualizações de protocolo",
      "Executar práticas clínicas supervisionadas com autonomia",
    ],
    targetAudience: [
      "Fisioterapeutas que atuam ou desejam atuar com assoalho pélvico",
      "Profissionais de saúde com interesse em reabilitação pélvica",
      "Fisioterapeutas em busca de especialização prática e científica",
    ],
    modules: [
      {
        title: "Módulo 1 — Anatomia e Biomecânica",
        lessons: [
          "Anatomia detalhada do assoalho pélvico",
          "Biomecânica e fisiologia pélvica",
          "Fisiopatologia das disfunções mais prevalentes",
        ],
      },
      {
        title: "Módulo 2 — Avaliação Clínica e Instrumental",
        lessons: [
          "Anamnese e exame físico especializado",
          "Avaliação instrumental do assoalho pélvico",
          "Interpretação de achados e diagnóstico funcional",
        ],
      },
      {
        title: "Módulo 3 — Estratégias Terapêuticas",
        lessons: [
          "Técnicas de reabilitação baseadas em evidências",
          "Protocolos para incontinência urinária e fecal",
          "Abordagem das disfunções sexuais femininas",
        ],
      },
      {
        title: "Módulo 4 — Casos Clínicos e Protocolos",
        lessons: [
          "Discussão de casos clínicos reais",
          "Atualizações de protocolo e guidelines internacionais",
          "Documentação e laudo clínico",
        ],
      },
      {
        title: "Módulo 5 — Prática Supervisionada",
        lessons: [
          "Atendimento supervisionado em ambiente clínico",
          "Execução de técnicas sob supervisão direta",
          "Feedback individualizado e plano de desenvolvimento",
        ],
      },
    ],
    includes: [
      "30h de treinamento teórico-prático (17 a 19 de junho de 2026)",
      "Turmas com no máximo 2 alunos por data — atenção individualizada",
      "Certificado de conclusão",
      "Material de apoio digital",
      "Suporte pós-curso",
    ],
  },
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return courses.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await prisma.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { instructor: { include: { user: true } } },
  });
  if (!course) return {};

  return {
    title: course.metaTitle ?? `${course.title} | Nuvem Ensino`,
    description: course.metaDesc ?? course.shortDesc ?? course.description,
    openGraph: {
      title: course.title,
      description: course.shortDesc ?? course.description,
      images: course.thumbnailUrl ? [course.thumbnailUrl] : [],
    },
  };
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;

  const course = await prisma.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      instructor: { include: { user: true } },
      tags: { include: { tag: true } },
    },
  });

  if (!course) notFound();

  const content = staticContent[slug] ?? null;
  const reservedPct =
    course.totalSeats && course.totalSeats > 0
      ? Math.round(((course.reservedSeats ?? 0) / course.totalSeats) * 100)
      : 0;
  const availableSeats =
    course.totalSeats !== null
      ? course.totalSeats - (course.reservedSeats ?? 0)
      : null;
  const categoryLabel =
    course.category === "HANDS_ON"
      ? "Hands-On"
      : course.category === "ONLINE"
      ? "Online"
      : "Híbrido";
  const primaryTag = course.tags[0]?.tag.name;

  return (
    <div>
      {/* ── Hero do curso ── */}
      <section className="bg-canvas px-4 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 font-sans text-xs text-white/40 mb-8">
            <Link href="/" className="hover:text-white/70 transition-colors">Início</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/cursos" className="hover:text-white/70 transition-colors">Cursos</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/60">{course.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12 items-start">
            {/* Info principal */}
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="font-sans text-[10px] font-semibold uppercase tracking-widest text-accent bg-primary/60 border border-accent/20 px-3 py-1 rounded-full">
                  {categoryLabel}
                </span>
                {primaryTag && (
                  <span className="font-sans text-[10px] font-semibold uppercase tracking-widest text-white/50">
                    {primaryTag}
                  </span>
                )}
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl font-light text-white leading-tight mb-4">
                {course.title}
              </h1>
              <p className="font-sans text-base text-white/60 leading-relaxed max-w-2xl mb-8">
                {course.description}
              </p>

              <div className="flex flex-wrap gap-6 text-white/70">
                <span className="flex items-center gap-2 font-sans text-sm">
                  <Clock className="w-4 h-4 text-accent/70" />
                  {course.hours}h de formação
                </span>
                {availableSeats !== null && (
                  <span className="flex items-center gap-2 font-sans text-sm">
                    <Users className="w-4 h-4 text-accent/70" />
                    {availableSeats} vagas disponíveis
                  </span>
                )}
                {course.location && (
                  <span className="flex items-center gap-2 font-sans text-sm">
                    <MapPin className="w-4 h-4 text-accent/70" />
                    {course.location}
                  </span>
                )}
                {content?.startDate && (
                  <span className="flex items-center gap-2 font-sans text-sm">
                    <Calendar className="w-4 h-4 text-accent/70" />
                    {content.startDate}
                  </span>
                )}
              </div>
            </div>

            {/* Card de inscrição */}
            <div className="lg:sticky lg:top-24">
              <div
                className="rounded-2xl border border-white/10 p-6"
                style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}
              >
                <p className="font-serif text-4xl font-semibold text-accent mb-1">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(course.price))}
                </p>
                <p className="font-sans text-xs text-white/40 mb-6">
                  {course.category === "ONLINE"
                    ? "Acesso completo ao curso"
                    : "Por pessoa — inclui todos os módulos"}
                </p>

                {course.totalSeats && reservedPct > 0 && (
                  <div className="mb-5">
                    <div className="flex justify-between font-sans text-[11px] text-white/50 mb-1.5">
                      <span>Reservas</span>
                      <span>{reservedPct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent/60 rounded-full"
                        style={{ width: `${reservedPct}%` }}
                      />
                    </div>
                  </div>
                )}

                <Link
                  href={`/checkout/${course.slug}`}
                  className="block w-full text-center font-sans text-sm font-semibold px-6 py-3.5 rounded-full bg-accent text-accent-foreground hover:bg-accent-light transition-colors mb-3"
                >
                  Inscrever-se agora
                </Link>
                <a
                  href="https://wa.me/5531997261029"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center font-sans text-sm font-semibold px-6 py-3.5 rounded-full border border-white/20 text-white/80 hover:border-white/50 hover:text-white transition-all"
                >
                  Tirar dúvidas no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Preview do curso (YouTube) ── */}
      {course.previewUrl && (
        <section className="bg-canvas/50 border-b border-white/5 py-10 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative w-full rounded-2xl overflow-hidden border border-white/10" style={{ paddingTop: "56.25%" }}>
              <iframe
                src={course.previewUrl}
                title={course.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        </section>
      )}

      {/* ── Conteúdo principal ── */}
      <div className="max-w-5xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12 items-start">
        <div className="space-y-14">
          {/* O que você vai aprender */}
          {content?.objectives && (
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-6 flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-primary/60" />
                O que você vai aprender
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {content.objectives.map((obj) => (
                  <li key={obj} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="font-sans text-sm text-muted leading-relaxed">{obj}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Ementa */}
          {content?.modules && (
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-6">
                Conteúdo do Curso
              </h2>
              <div className="flex flex-col gap-3">
                {content.modules.map((mod, i) => (
                  <details
                    key={mod.title}
                    className="group rounded-xl border border-border bg-surface overflow-hidden"
                    open={i === 0}
                  >
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none font-sans text-sm font-semibold text-foreground select-none">
                      {mod.title}
                      <ChevronRight className="w-4 h-4 text-muted transition-transform group-open:rotate-90" />
                    </summary>
                    <ul className="px-5 pb-4 flex flex-col gap-2 border-t border-border">
                      {mod.lessons.map((lesson) => (
                        <li
                          key={lesson}
                          className="flex items-center gap-3 font-sans text-sm text-muted py-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                          {lesson}
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Público-alvo */}
          {content?.targetAudience && (
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-6">
                Para quem é este curso
              </h2>
              <ul className="flex flex-col gap-2">
                {content.targetAudience.map((target) => (
                  <li key={target} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-sans text-sm text-muted">{target}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* O que está incluído */}
          {content?.includes && (
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-6 flex items-center gap-3">
                <Award className="w-5 h-5 text-primary/60" />
                O que está incluído
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {content.includes.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-accent-dark mt-0.5 shrink-0" />
                    <span className="font-sans text-sm text-muted leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ── Sidebar — Instrutor ── */}
        <div className="lg:sticky lg:top-24 space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-6">
            <p className="font-sans text-[11px] font-bold uppercase tracking-widest text-muted mb-4">
              Instrutor
            </p>
            <div className="flex items-start gap-4 mb-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 shrink-0">
                {course.instructor.photoUrl ? (
                  <Image
                    src={course.instructor.photoUrl}
                    alt={course.instructor.user.name ?? ""}
                    fill
                    className="object-cover object-top"
                    sizes="64px"
                  />
                ) : (
                  <div className="w-full h-full bg-canvas" />
                )}
              </div>
              <div>
                <p className="font-serif text-lg font-medium text-foreground leading-tight">
                  {course.instructor.user.name}
                </p>
                <p className="font-sans text-xs text-muted mt-1 leading-snug">
                  {course.instructor.title}
                  {course.instructor.crm && ` · ${course.instructor.crm}`}
                </p>
              </div>
            </div>
            {content?.instructorBio && (
              <p className="font-sans text-sm text-muted leading-relaxed">
                {content.instructorBio}
              </p>
            )}
          </div>

          {/* CTA mobile */}
          <div className="lg:hidden bg-surface border border-border rounded-2xl p-6">
            <p className="font-serif text-3xl font-semibold text-primary mb-1">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(Number(course.price))}
            </p>
            <p className="font-sans text-xs text-muted mb-5">
              {course.hours}h de formação
            </p>
            <Link
              href={`/checkout/${course.slug}`}
              className="block w-full text-center font-sans text-sm font-semibold px-6 py-3.5 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              Inscrever-se agora
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
