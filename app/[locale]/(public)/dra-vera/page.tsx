import Image from "next/image";
import Link from "next/link";
import { Instagram, Linkedin, Globe, GraduationCap, Microscope, BookOpen, Award } from "lucide-react";
import { DraveraEvaluationForm } from "./DraveraEvaluationForm";

export const metadata = {
  title: "Dra. Vera Ângelo · Avaliação da Apresentação",
  description: "Avalie a apresentação da Dra. Vera Lúcia Ângelo Andrade — Gastroenterologista e Neurogastroenterologista, Doutora pela UFMG.",
};

const socials = [
  {
    label: "Instagram Dra. Vera",
    href: "https://www.instagram.com/veraluciaangeloandrade/",
    icon: <Instagram className="w-4 h-4" />,
    handle: "@veraluciaangeloandrade",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/vera-lucia-angelo-andrade-b545b02a/",
    icon: <Linkedin className="w-4 h-4" />,
    handle: "Vera Lucia Angelo Andrade",
  },
  {
    label: "Instagram NU.V.E.M ENSINO",
    href: "https://www.instagram.com/nuvemensino/",
    icon: <Instagram className="w-4 h-4" />,
    handle: "@nuvemensino",
  },
  {
    label: "Site NU.V.E.M ENSINO",
    href: "https://nuvemensino.com.br",
    icon: <Globe className="w-4 h-4" />,
    handle: "nuvemensino.com.br",
  },
];

const credentials = [
  { icon: <GraduationCap className="w-4 h-4 text-primary" />, text: "Graduação em Medicina — UFMG (1989)" },
  { icon: <GraduationCap className="w-4 h-4 text-primary" />, text: "Mestrado em Ciências — Patologia Geral, UFMG (1996)" },
  { icon: <GraduationCap className="w-4 h-4 text-primary" />, text: "Doutorado em Ciências — Patologia Geral, UFMG (2000)" },
  { icon: <Award className="w-4 h-4 text-primary" />, text: "Especialista em Gastroenterologia — FBG · CRM-MG 22284" },
  { icon: <Award className="w-4 h-4 text-primary" />, text: "Especialista em Doenças Funcionais e Manometria — Hospital Israelita Albert Einstein" },
  { icon: <Award className="w-4 h-4 text-primary" />, text: "Membro da American Gastroenterological Association (AGA)" },
  { icon: <BookOpen className="w-4 h-4 text-primary" />, text: "Professora de Medicina — UFMG (desde 1993)" },
  { icon: <BookOpen className="w-4 h-4 text-primary" />, text: "Diretora Científica — NU.V.E.M ENSINO" },
];

const expertise = [
  "Neurogastroenterologia e Motilidade Digestiva",
  "Testes Respiratórios (SIBO, IMO, H. pylori)",
  "Manometria Esofágica de Alta Resolução",
  "Microbiota Intestinal",
  "Interação Intestino-Cérebro",
  "Esofagite Eosinofílica",
  "Síndrome do Intestino Irritável",
  "Acalásia",
];

const stats = [
  { value: "+20.000", label: "pHmetrias esofágicas" },
  { value: "+16.000", label: "manometrias esofágicas" },
  { value: "+3.000", label: "testes respiratórios" },
  { value: "+30 anos", label: "de experiência clínica" },
];

export default function DraveraPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="bg-white border-b border-border px-4 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/">
          <Image src="/logo.png" alt="NU.V.E.M ENSINO" width={90} height={70} className="h-8 w-auto" />
        </Link>
        <Link href="/cursos" className="text-sm text-primary font-medium hover:underline">Ver cursos</Link>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Perfil */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-primary to-primary/70" />

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="-mt-12 mb-4 flex items-end justify-between">
              <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-primary/10 shrink-0">
                <Image
                  src="/vera.jpeg"
                  alt="Dra. Vera Ângelo"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  onError={() => {}}
                />
              </div>
              {/* Redes sociais */}
              <div className="flex gap-2 flex-wrap justify-end">
                {socials.map((s) => (
                  <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer"
                    title={s.label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 text-primary hover:bg-primary/15 transition-colors text-xs font-medium">
                    {s.icon}
                    <span className="hidden sm:inline">{s.handle}</span>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h1 className="font-serif text-2xl font-semibold text-foreground">Dra. Vera Lúcia Ângelo Andrade</h1>
              <p className="text-sm text-primary font-medium mt-0.5">Gastroenterologista · Neurogastroenterologista · Doutora pela UFMG</p>
              <p className="text-xs text-muted mt-1">CRM-MG 22284 · RQE 10411 · RQE 22736</p>
            </div>

            <p className="mt-4 text-sm text-foreground/80 leading-relaxed">
              Com mais de 30 anos dedicados à medicina digestiva, a Dra. Vera é referência nacional em Neurogastroenterologia e Motilidade Digestiva.
              Doutora pela UFMG, professora universitária desde 1993 e Diretora Científica da NU.V.E.M ENSINO, ela une rigor científico e
              didática para transformar a formação médica no Brasil.
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-border p-4 text-center">
              <p className="font-serif text-xl font-semibold text-primary">{s.value}</p>
              <p className="text-xs text-muted mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Formação e Áreas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Formação */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-4">Formação e Títulos</h2>
            <ul className="space-y-2.5">
              {credentials.map((c, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 shrink-0">{c.icon}</span>
                  <span className="text-xs text-foreground/80 leading-relaxed">{c.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Especialidades */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-4">Áreas de Atuação</h2>
            <div className="flex flex-wrap gap-2">
              {expertise.map((e) => (
                <span key={e} className="text-xs px-2.5 py-1 rounded-full bg-primary/8 text-primary font-medium">
                  {e}
                </span>
              ))}
            </div>

            <div className="mt-5 pt-5 border-t border-border">
              <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-3">NU.V.E.M ENSINO</h2>
              <div className="flex flex-col gap-2">
                {socials.map((s) => (
                  <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-muted hover:text-primary transition-colors">
                    {s.icon}
                    <span>{s.handle}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div>
          <div className="mb-6 text-center">
            <h2 className="font-serif text-xl font-semibold text-foreground">Avalie a apresentação</h2>
            <p className="text-sm text-muted mt-1">Sua opinião é fundamental para continuarmos evoluindo. Leva menos de 2 minutos.</p>
          </div>
          <DraveraEvaluationForm />
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6 text-center text-xs text-muted">
        © {new Date().getFullYear()} NU.V.E.M ENSINO · Todos os direitos reservados
      </footer>
    </div>
  );
}
