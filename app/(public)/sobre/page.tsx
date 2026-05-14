import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Award, BookOpen, Users, MapPin, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Sobre | Nuvem Ensino",
  description:
    "Conheça a Nuvem Ensino — plataforma de formação médica da Nuvem Medicina, única clínica com certificação ISO 9001 no segmento em Belo Horizonte.",
};

const diferenciais = [
  {
    icon: Award,
    title: "ISO 9001 Certificada",
    desc: "A Nuvem Medicina é a única clínica do segmento em Belo Horizonte com certificação ISO 9001 em gestão da qualidade.",
  },
  {
    icon: BookOpen,
    title: "Cursos com prática real",
    desc: "Todos os cursos hands-on são realizados na própria clínica, com equipamentos de alto padrão e pacientes reais sob supervisão.",
  },
  {
    icon: Users,
    title: "Especialistas referência nacional",
    desc: "O corpo docente é formado por médicos e fisioterapeutas com ampla experiência clínica e acadêmica em suas especialidades.",
  },
  {
    icon: MapPin,
    title: "Belo Horizonte — MG",
    desc: "Estrutura completa para cursos presenciais, com laboratórios equipados e ambiente preparado para o aprendizado avançado.",
  },
];

const instrutores = [
  {
    nome: "Dra. Vera Ângelo",
    crm: "CRM-MG 22284 · RQE 10411 · RQE 22736",
    especialidade: "Gastroenterologia · Motilidade Digestiva",
    bio: "Diretora da Nuvem Medicina e referência em exames de motilidade digestiva no Brasil. Pioneira na realização de testes respiratórios com novos protocolos e na formação de profissionais de saúde na área.",
    foto: "/instructors/dra-vera.jpg",
  },
  {
    nome: "Dra. Anna Karoline",
    crm: "",
    especialidade: "Fisioterapia Pélvica",
    bio: "Fisioterapeuta especialista em disfunções do assoalho pélvico, com atuação clínica em avaliação e reabilitação pélvica feminina.",
    foto: "/instructors/anna-karoline.jpg",
  },
  {
    nome: "Dra. Eliane Basques",
    crm: "",
    especialidade: "Gastroenterologia · Manometria Anorretal",
    bio: "Especialista em manometria anorretal de alta resolução e distúrbios funcionais do assoalho pélvico.",
    foto: "/instructors/dra-eliane.jpg",
  },
  {
    nome: "Dr. Felipe Nelson",
    crm: "",
    especialidade: "Gastroenterologia · Manometria · pHmetria",
    bio: "Referência em exames de motilidade esofágica, pHmetria de 24 horas e impedancio-pHmetria. Mais de 10 anos de experiência clínica.",
    foto: "/instructors/felipe-nelson.jpg",
  },
];

export default function SobrePage() {
  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="bg-canvas px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <span className="font-sans text-xs font-semibold tracking-[0.25em] uppercase text-accent opacity-80 mb-4 block">
            Sobre nós
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-light text-white mb-6 leading-tight">
            Ensino médico de excelência,<br className="hidden sm:block" /> direto da prática clínica
          </h1>
          <p className="font-sans text-base text-white/60 max-w-2xl mx-auto leading-relaxed">
            A Nuvem Ensino nasceu dentro da Nuvem Medicina — clínica especializada em motilidade digestiva e
            fisioterapia respiratória em Belo Horizonte. Compartilhamos o que praticamos todos os dias, com
            rigor científico e compromisso com a qualidade.
          </p>
        </div>
      </section>

      {/* História */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-serif text-3xl font-medium text-foreground mb-5">
              Uma clínica que virou escola
            </h2>
            <div className="space-y-4 font-sans text-sm text-muted leading-relaxed">
              <p>
                A Nuvem Medicina foi fundada pela Dra. Vera Ângelo com o propósito de elevar o padrão dos
                exames de motilidade digestiva em Minas Gerais. Com o tempo, médicos e fisioterapeutas de
                todo o Brasil passaram a buscar capacitação prática nas técnicas realizadas na clínica.
              </p>
              <p>
                A Nuvem Ensino é a resposta a essa demanda: uma plataforma que une o rigor clínico de uma
                estrutura certificada com a flexibilidade do ensino online e presencial, permitindo que
                profissionais de saúde desenvolvam competências reais em procedimentos de alta complexidade.
              </p>
              <p>
                Nossos cursos combinam aulas gravadas com módulos práticos supervisionados, laudos comentados
                e discussão de casos clínicos reais — porque acreditamos que a formação de verdade acontece
                na interface entre teoria e prática.
              </p>
            </div>
          </div>

          {/* ISO 9001 destaque */}
          <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <Image
                src="/selo-iso-9001.png"
                alt="Certificação ISO 9001"
                width={72}
                height={72}
                className="w-16 h-16 object-contain shrink-0"
              />
              <div>
                <p className="font-sans text-xs font-bold uppercase tracking-widest text-primary mb-1">
                  Certificação ISO 9001
                </p>
                <h3 className="font-serif text-xl font-medium text-foreground leading-snug">
                  Única clínica do segmento em BH
                </h3>
              </div>
            </div>
            <p className="font-sans text-sm text-muted leading-relaxed">
              A Nuvem Medicina é certificada pela norma ISO 9001, que atesta a excelência em gestão da
              qualidade em todos os processos clínicos e educacionais. Essa certificação reflete nosso
              compromisso com segurança, padronização e melhoria contínua.
            </p>
            <Link
              href="https://nuvemmedicina.com.br/gestao-da-qualidade-iso-9001/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-sans text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              Saiba mais sobre nossa certificação
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="bg-surface border-y border-border py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-serif text-2xl font-medium text-foreground text-center mb-10">
            Por que a Nuvem Ensino
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
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="font-serif text-2xl font-medium text-foreground text-center mb-10">
          Corpo docente
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {instrutores.map(({ nome, crm, especialidade, bio, foto }) => (
            <div key={nome} className="bg-surface border border-border rounded-2xl p-6 flex gap-5">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                <Image
                  src={foto}
                  alt={nome}
                  fill
                  className="object-cover object-top"
                  sizes="80px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-lg font-medium text-foreground">{nome}</h3>
                <p className="font-sans text-xs text-primary font-semibold mt-0.5 mb-1">{especialidade}</p>
                {crm && (
                  <p className="font-sans text-[10px] text-muted mb-2">{crm}</p>
                )}
                <p className="font-sans text-xs text-muted leading-relaxed">{bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-20 px-4 text-center"
        style={{
          backgroundColor: "#CBE4E6",
          backgroundImage: `
            linear-gradient(rgba(0,71,94,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,71,94,0.07) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      >
        <div
          className="max-w-2xl mx-auto py-16 px-8 rounded-3xl border border-primary/15"
          style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(8px)" }}
        >
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-primary mb-4">
            Pronto para avançar na sua formação?
          </h2>
          <p className="font-sans text-sm text-primary/70 mb-8 leading-relaxed">
            Explore o catálogo da <strong>NU.V.E.M Ensino.</strong> e encontre o curso certo para a sua especialidade.
          </p>
          <Link
            href="/cursos"
            className="inline-block font-sans text-sm font-semibold px-10 py-4 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            Ver todos os cursos
          </Link>
        </div>
      </section>

    </div>
  );
}
