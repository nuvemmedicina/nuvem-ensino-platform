import { DraveraEvaluationForm } from "./DraveraEvaluationForm";

export const metadata = {
  title: "Dra. Vera Ângelo · Avaliação da Apresentação",
  description:
    "Avalie a apresentação da Dra. Vera Lúcia Ângelo Andrade e conheça seu currículo.",
};

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

const socialLinks = {
  vera: [
    { label: "Instagram", href: "https://www.instagram.com/veraangelo/", icon: <InstagramIcon /> },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/vera-lucia-angelo-andrade-b545b02a/", icon: <LinkedinIcon /> },
  ],
  nuvemEnsino: [
    { label: "@nuvemensino", href: "https://www.instagram.com/nuvemensino/", icon: <InstagramIcon /> },
    { label: "YouTube", href: "https://www.youtube.com/@nuvemensino", icon: <YoutubeIcon /> },
  ],
  nuvemMedicina: [
    { label: "@nuvemmedicina", href: "https://www.instagram.com/nuvemmedicina/", icon: <InstagramIcon /> },
    { label: "YouTube", href: "https://www.youtube.com/@NuvemMedicina", icon: <YoutubeIcon /> },
  ],
};

const books = [
  {
    title: "Perguntas e Respostas Comentadas de Gastrenterologia Clínica e Hepatologia",
    href: "https://rubio.com.br/livro/a62313/9786588340998/perguntas-e-respostas-comentadas-de-gastrenterologia-clinica-e-hepatologia.html",
  },
  {
    title: "Testes Respiratórios em Gastrenterologia — Hidrogênio, Metano e Helicobacter Pylori",
    href: "https://rubio.com.br/livro/a62312/9786588340974/testes-respiratorios-em-gastrenterologia-hidrogenio-metano-e-helicobacter-pylori.html",
  },
  {
    title: "Métodos Diagnósticos em Doenças Funcionais e Motilidade Digestiva",
    href: "https://rubio.com.br/livro/c58906/9786588340844/metodos-diagnosticos-em-doencas-funcionais-e-motilidade-digestiva-do-nucleo-de-fisiologia-gastrintes.html",
  },
  {
    title: "Doenças Funcionais na Gastrenterologia",
    href: "https://rubio.com.br/livro/a61637/9786588340783/doencas-funcionais-na-gastrenterologia.html",
  },
  {
    title: "Casos Comentados de Gastroenterologia e Hepatologia",
    href: "https://rubio.com.br/livro/a57235/9786588340028/casos-comentados-de-gastrenterologia-e-hepatologia.html",
  },
];

const upcomingEvents = [
  {
    date: "22 Jul 2026",
    title: "Live Exclusiva — Curso DICI",
    detail: "19h30 · Desconto especial para participantes",
    location: "Online · Ao vivo",
    href: "https://www.nuvemensino.com.br/live",
  },
  {
    date: "Jul 2026",
    title: "Testes Respiratórios de H₂, CH₄ e H₂S",
    detail: "Hands-on teórico-prático com equipamentos Dynamed e Health Go",
    location: "Presencial · Nuvem Ensino",
    href: "https://www.nuvemensino.com.br/cursos/testes-respiratorios-h2-ch4-h2s-julho",
  },
  {
    date: "2026",
    title: "Curso de Aperfeiçoamento em DICI",
    detail: "Neurogastroenterologia e Métodos Diagnósticos Complementares",
    location: "Online · Nuvem Ensino",
    href: "https://www.nuvemensino.com.br/cursos/dici-neurogastroenterologia-2026",
  },
];

export default function DraveraPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── CAPA HERO ── */}
      <div className="bg-[#001f2d] lg:grid lg:grid-cols-2 lg:min-h-[520px]">
        {/* Foto */}
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/3" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/instructors/dra-vera-angelo-1.jpeg"
            alt="Dra. Vera Lúcia Ângelo Andrade"
            className="absolute inset-0 w-full h-full object-cover object-[50%_25%] lg:object-[50%_15%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#001f2d]/50 via-transparent to-[#001f2d]/20 lg:bg-gradient-to-r lg:from-transparent lg:to-[#001f2d]/60" />

          {/* Logo — só no mobile (no desktop fica no painel de texto) */}
          <div className="absolute top-5 left-5 z-10 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/nuvem-ensino-branca.png" alt="NU.V.E.M ENSINO" className="h-8 w-auto drop-shadow-md" />
          </div>
        </div>

        {/* Texto */}
        <div className="px-6 py-7 lg:px-12 lg:py-0 lg:flex lg:flex-col lg:justify-center">
          {/* Logo — só no desktop */}
          <div className="hidden lg:block mb-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/nuvem-ensino-branca.png" alt="NU.V.E.M ENSINO" className="h-9 w-auto" />
          </div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#C9A84C] mb-1">
            Dra.
          </p>
          <h1 className="font-serif text-3xl lg:text-5xl font-normal text-white leading-tight mb-2">
            Vera Lúcia Ângelo Andrade
          </h1>
          <p className="text-sm text-white/70 mb-1">
            Médica Gastroenterologista · Mestre e Doutora em Patologia
          </p>
          <p className="text-xs text-white/50 mb-6">
            CRM: 22284 MG · RQE: 10411 | 22736 · Diretora Científica da NU.V.E.M Ensino
          </p>
          <div className="flex flex-wrap gap-2">
            {socialLinks.vera.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-colors text-sm text-white"
              >
                {s.icon}
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── FORMULÁRIO — fundo cinza com grade ── */}
      <div
        className="py-12 px-6"
        style={{
          backgroundColor: "#f1f5f5",
          backgroundImage: `
            linear-gradient(rgba(0,71,94,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,71,94,0.06) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-[#00475e]/60 mb-4">
            Avalie a apresentação
          </h2>
          <DraveraEvaluationForm />
        </div>
      </div>

      {/* ── CURRÍCULO — fundo branco ── */}
      <div className="bg-white py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-4 text-center">
            Currículo
          </h2>
          <div className="rounded-2xl border border-border bg-white p-6 space-y-5 text-sm shadow-sm">
            <div>
              <p className="font-semibold text-foreground mb-2">Formação Acadêmica e Especialização</p>
              <ul className="space-y-1.5 text-muted list-disc list-inside">
                <li>Gastroenterologista com especialização em Neurogastroenterologia e Manometria Digestiva pelo Hospital Israelita Albert Einstein</li>
                <li>Mestre e Doutora em Patologia pela Universidade Federal de Minas Gerais (UFMG)</li>
              </ul>
            </div>
            <div className="h-px bg-border" />
            <div>
              <p className="font-semibold text-foreground mb-2">Trajetória e Experiência</p>
              <ul className="space-y-1.5 text-muted list-disc list-inside">
                <li>Há 30 anos atuando na formação de profissionais em Motilidade Digestiva, Neurogastroenterologia, Microbiota Intestinal e Testes Respiratórios</li>
                <li>Palestrante em congressos nacionais e internacionais</li>
                <li>Autora de livros e diversas publicações científicas na área</li>
              </ul>
            </div>
            <div className="h-px bg-border" />
            <div>
              <p className="font-semibold text-foreground mb-2">Liderança Atual</p>
              <ul className="space-y-1.5 text-muted list-disc list-inside">
                <li>Diretora Científica da NU.V.E.M Ensino</li>
                <li>Diretora Técnica da NU.V.E.M Medicina</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── AGENDA — fundo cinza ── */}
      <div className="bg-[#f1f5f5] py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-4 text-center">
            Próximos cursos e eventos
          </h2>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.title}
                className="rounded-2xl border border-border bg-white p-5 flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex gap-4 items-start">
                  <div className="min-w-[72px] rounded-xl bg-[#00475e]/10 px-3 py-2 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#00475e]">
                      {event.date.split(" ")[0]}
                    </p>
                    <p className="text-xs text-[#00475e]/60">{event.date.split(" ")[1]}</p>
                  </div>
                  <div>
                    <p className="font-sans text-sm font-semibold text-foreground">{event.title}</p>
                    <p className="text-xs text-muted mt-0.5">{event.detail}</p>
                    <p className="text-xs text-muted/60 mt-0.5">{event.location}</p>
                  </div>
                </div>
                <a
                  href={event.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-4 py-2 rounded-full bg-[#00475e] text-white text-xs font-semibold hover:bg-[#00475e]/90 transition-colors whitespace-nowrap"
                >
                  Inscrever-se
                </a>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted/60 mt-3 text-center">
            Datas sujeitas a alteração. Acompanhe nas redes sociais para atualizações.
          </p>
        </div>
      </div>

      {/* ── REDES SOCIAIS — fundo branco ── */}
      <div className="bg-white py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-4 text-center">
            Conecte-se
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border p-5 shadow-sm">
              <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-3">
                Nuvem Ensino
              </p>
              <div className="space-y-2">
                {socialLinks.nuvemEnsino.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
                    <span className="text-muted">{s.icon}</span>{s.label}
                  </a>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border p-5 shadow-sm">
              <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-3">
                Nuvem Medicina
              </p>
              <div className="space-y-2">
                {socialLinks.nuvemMedicina.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
                    <span className="text-muted">{s.icon}</span>{s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── LIVROS — fundo cinza ── */}
      <div className="bg-[#f1f5f5] py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted text-center flex-1">
              Publicações · Editora Rubio
            </h2>
            <a
              href="https://rubio.com.br/busca?q=Andrade%2C+Vera+L%C3%BAcia+%C3%82ngelo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#00475e] font-semibold hover:underline"
            >
              Ver todas →
            </a>
          </div>
          <div className="flex flex-col gap-3">
            {books.map((book) => (
              <div key={book.href} className="rounded-2xl border border-border bg-white shadow-sm p-5 flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-foreground leading-snug">{book.title}</p>
                <a
                  href={book.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-4 py-2 rounded-full bg-[#00475e] text-white text-xs font-semibold hover:bg-[#00475e]/90 transition-colors whitespace-nowrap"
                >
                  Comprar
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="bg-white text-center text-xs text-muted/60 py-6 border-t border-border">
        © {new Date().getFullYear()} Nuvem Ensino · Todos os direitos reservados
      </footer>
    </div>
  );
}
