import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Award, BookOpen, Users, MapPin, ExternalLink, Star, GraduationCap, Microscope, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Sobre | NU.V.E.M Ensino",
  description:
    "A NU.V.E.M nasceu da visão de duas médicas que acreditaram que era possível fazer diferente, com mais precisão, mais cuidado e mais propósito.",
};

const numeros = [
  { icon: Star,          valor: "+2.000",     label: "Avaliações no Google" },
  { icon: GraduationCap, valor: "Centenas",   label: "Profissionais formados" },
  { icon: Microscope,    valor: "6",          label: "Especialidades médicas" },
  { icon: Award,         valor: "ISO 9001",   label: "Certificação internacional" },
  { icon: Globe,         valor: "Brasil e exterior", label: "Alunos em todo o mundo" },
];

const diferenciais = [
  {
    icon: Award,
    title: "ISO 9001 Certificada",
    desc: "Única clínica do segmento em Belo Horizonte com certificação ISO 9001. Cada processo, do agendamento ao certificado, segue protocolos rigorosos auditados por organismos independentes.",
  },
  {
    icon: BookOpen,
    title: "Formação baseada em casos reais",
    desc: "Os cursos são realizados na própria clínica, com equipamentos de última geração e metodologia baseada em casos clínicos reais, unindo teoria e prática de forma consistente.",
  },
  {
    icon: Users,
    title: "Fundada por especialistas",
    desc: "Criada pela Dra. Vera Ângelo e pela Dra. Eliane Basques, médicas apaixonadas pela medicina e pelo poder transformador do conhecimento compartilhado.",
  },
  {
    icon: MapPin,
    title: "Belo Horizonte, MG",
    desc: "Estrutura completa para cursos presenciais hands-on, com laboratórios equipados e ambiente pensado para o aprendizado avançado em saúde.",
  },
];

const instrutores = [
  {
    nome: "Dra. Vera Ângelo",
    crm: "CRM-MG 22284 · RQE 10411 · RQE 22736",
    especialidade: "Gastroenterologia · Motilidade Digestiva",
    bio: "Cofundadora e diretora da NU.V.E.M Medicina. Referência nacional em exames de motilidade digestiva, pioneira nos novos protocolos de testes respiratórios H₂/CH₄/H₂S e formadora de especialistas em todo o Brasil.",
    foto: "/instructors/dra-vera.jpg",
  },
  {
    nome: "Dra. Eliane Basques",
    crm: "",
    especialidade: "Gastroenterologia · Manometria Anorretal",
    bio: "Cofundadora da NU.V.E.M. Cirurgiã pediátrica da FHEMIG, especialista em manometria anorretal de alta resolução e distúrbios funcionais do assoalho pélvico.",
    foto: "/instructors/dra-eliane.jpg",
  },
  {
    nome: "Dr. Wanderley Bertoni",
    crm: "CRM-MG 26967 · RQE 24610/38052",
    especialidade: "Gastroenterologia · Endoscopia Digestiva",
    bio: "Gastroenterologista pela UFRJ, Professor da Faculdade de Medicina da FAMINAS-Muriaé, Especialista em Gastroenterologia pela FBG e Titular da SOBED.",
    foto: "/instructors/wanderley-bertoni.jpg",
  },
  {
    nome: "Dr. Felipe Nelson",
    crm: "",
    especialidade: "Gastroenterologia · Manometria · pHmetria",
    bio: "Referência em exames de motilidade esofágica, pHmetria de 24 horas e impedancio-pHmetria. Mais de 10 anos de experiência clínica.",
    foto: "/instructors/felipe-nelson.jpg",
  },
  {
    nome: "Dra. Anna Karoline",
    crm: "",
    especialidade: "Fisioterapia Pélvica",
    bio: "Fisioterapeuta especialista em disfunções do assoalho pélvico, com atuação clínica em avaliação e reabilitação pélvica.",
    foto: "/instructors/anna-karoline.jpg",
  },
];

export default function SobrePage() {
  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="bg-canvas px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <span className="font-sans text-xs font-semibold tracking-[0.25em] uppercase text-accent opacity-80 mb-4 block">
            Sobre a NU.V.E.M
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-light text-white mb-6 leading-tight">
            Uma nova forma de cuidar.<br className="hidden sm:block" /> Uma nova forma de ensinar.
          </h1>
          <p className="font-sans text-base text-white/60 max-w-2xl mx-auto leading-relaxed">
            A NU.V.E.M nasceu da visão de duas médicas que acreditaram que era possível fazer diferente,
            com mais precisão, mais cuidado e mais propósito.
          </p>
        </div>
      </section>

      {/* Fundadoras */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-primary mb-3">
              Fundada por quem vive a medicina todos os dias
            </p>
            <h2 className="font-serif text-3xl font-medium text-foreground mb-5">
              Clínica e ensino sob o mesmo teto
            </h2>
            <div className="space-y-4 font-sans text-sm text-muted leading-relaxed">
              <p>
                A NU.V.E.M Medicina e a NU.V.E.M Ensino foram fundadas pela <strong className="text-foreground">Dra. Vera Ângelo</strong> e
                pela <strong className="text-foreground">Dra. Eliane Basques</strong>, especialistas apaixonadas pela medicina e pelo poder
                transformador do conhecimento compartilhado.
              </p>
              <p>
                Juntas, criaram um ecossistema único que une clínica e ensino sob o mesmo teto, onde cada
                paciente atendido inspira um novo conteúdo, e cada profissional formado eleva o padrão do
                cuidado em saúde.
              </p>
              <p>
                A NU.V.E.M Medicina é referência em Gastroenterologia, Motilidade Digestiva, Fisioterapia
                Pélvica e Diagnóstico Avançado em Belo Horizonte, com equipamentos de última geração e uma
                equipe multidisciplinar altamente especializada.
              </p>
              <p>
                A NU.V.E.M Ensino nasceu como extensão natural dessa excelência clínica, formando médicos,
                fisioterapeutas e especialistas por meio de cursos teórico-práticos, imersões hands-on e
                metodologia baseada em casos reais da própria clínica.
              </p>
            </div>
          </div>

          {/* ISO 9001 */}
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
                  O padrão internacional de qualidade
                </h3>
              </div>
            </div>
            <p className="font-sans text-sm text-muted leading-relaxed">
              Somos a única clínica do segmento em Belo Horizonte com Certificação ISO 9001. Isso significa
              que cada processo, do agendamento ao diagnóstico, do ensino à emissão do certificado, segue
              protocolos rigorosos de qualidade, rastreabilidade e melhoria contínua, auditados por
              organismos certificadores independentes.
            </p>
            <p className="font-sans text-sm text-foreground font-medium leading-relaxed border-l-2 border-primary pl-4">
              Não é apenas um selo. É o compromisso de entregar excelência em cada detalhe, todos os dias.
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

      {/* Nossos números */}
      <section className="bg-canvas py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-2xl font-medium text-white text-center mb-10">
            Nossos números
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {numeros.map(({ icon: Icon, valor, label }) => (
              <div key={label} className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-surface border border-border text-center">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="font-serif text-lg font-semibold text-foreground leading-tight">{valor}</p>
                <p className="font-sans text-[11px] text-muted leading-snug">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O que significa NU.V.E.M */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="font-sans text-xs font-bold uppercase tracking-widest text-primary mb-4">
          O que significa NU.V.E.M?
        </p>
        <h2 className="font-serif text-3xl font-medium text-foreground mb-6 leading-snug">
          Mais do que um nome, uma filosofia
        </h2>
        <div className="space-y-4 font-sans text-sm text-muted leading-relaxed max-w-2xl mx-auto">
          <p>
            É um novo clima que une ideias, pessoas e sonhos, onde profissionais de saúde se encontram
            para aprender, crescer e transformar vidas.
          </p>
          <p>
            É o cuidado com o paciente elevado a um novo patamar. É a certeza de que a medicina praticada
            com rigor científico, humanidade e propósito faz toda a diferença.
          </p>
        </div>
        <blockquote className="mt-10 mx-auto max-w-2xl bg-surface border border-border rounded-2xl px-8 py-8">
          <p className="font-serif text-lg text-foreground italic leading-relaxed mb-4">
            "Trouxemos uma nova maneira de atender e ensinar. Um ambiente que inspira, que acolhe, que
            forma. Acima de tudo, o cuidado com a sua saúde."
          </p>
          <footer className="font-sans text-xs text-primary font-semibold tracking-wide uppercase">
            Dra. Vera Ângelo &amp; Dra. Eliane Basques, fundadoras
          </footer>
        </blockquote>
      </section>

      {/* Diferenciais */}
      <section className="bg-surface border-y border-border py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-serif text-2xl font-medium text-foreground text-center mb-10">
            Por que a NU.V.E.M Ensino
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
            Explore o catálogo da <strong>NU.V.E.M Ensino</strong> e encontre o curso certo para a sua especialidade.
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
