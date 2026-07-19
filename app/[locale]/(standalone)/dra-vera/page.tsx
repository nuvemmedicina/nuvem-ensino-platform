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
    {
      label: "Instagram",
      href: "https://www.instagram.com/dravera.angeo/",
      icon: <InstagramIcon />,
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/vera-l%C3%BAcia-%C3%A2ngelo-andrade-33b7b8137/",
      icon: <LinkedinIcon />,
    },
  ],
  nuvemEnsino: [
    {
      label: "@nuvemensino",
      href: "https://www.instagram.com/nuvemensino/",
      icon: <InstagramIcon />,
    },
    {
      label: "YouTube",
      href: "https://www.youtube.com/@nuvemensino",
      icon: <YoutubeIcon />,
    },
  ],
  nuvemMedicina: [
    {
      label: "@nuvemmedicina",
      href: "https://www.instagram.com/nuvemmedicina/",
      icon: <InstagramIcon />,
    },
    {
      label: "YouTube",
      href: "https://www.youtube.com/@nuvemmedicina",
      icon: <YoutubeIcon />,
    },
  ],
};

const books = [
  {
    file: "Casos Comentados de Gastroenterologia e Hepatologia.png",
    title: "Casos Comentados de Gastroenterologia e Hepatologia",
  },
  {
    file: "perguntas-e-respostas-comentadas-de-gastrenterologia-clinica-e-hepatologia..png",
    title: "Perguntas e Respostas Comentadas de Gastrenterologia Clínica e Hepatologia",
  },
  {
    file: "testes-respiratorios-em-gastrenterologia-hidrogenio-metano-e-helicobacter-pylori..png",
    title: "Testes Respiratórios em Gastrenterologia",
  },
  {
    file: "Doenças Funcionais Na Gastrenterologia.png",
    title: "Doenças Funcionais na Gastrenterologia",
  },
  {
    file: "Métodos Diagnósticos em Doenças Funcionais e Motilidade Digestiva.png",
    title: "Métodos Diagnósticos em Doenças Funcionais e Motilidade Digestiva",
  },
];

const upcomingEvents = [
  {
    date: "Agosto 2026",
    title: "Gastroenterologia na Prática Clínica",
    location: "Online · Nuvem Ensino",
    href: "https://nuvemensino.com.br/cursos",
  },
  {
    date: "Setembro 2026",
    title: "Doenças Funcionais e Motilidade",
    location: "Online · Nuvem Ensino",
    href: "https://nuvemensino.com.br/cursos",
  },
  {
    date: "Outubro 2026",
    title: "Workshop de Casos Comentados",
    location: "A confirmar",
    href: "https://nuvemensino.com.br/cursos",
  },
];

export default function DraveraPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-[#00475e] text-white">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-white/20 shrink-0 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/instructors/dra-vera-angelo-1.jpeg"
                alt="Dra. Vera Lúcia Ângelo Andrade"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60 mb-1">
                Dra.
              </p>
              <h1 className="font-serif text-3xl font-semibold text-white mb-1">
                Vera Lúcia Ângelo Andrade
              </h1>
              <p className="text-sm text-white/70 mb-5">
                Médica Gastroenterologista · Autora · Palestrante
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                {socialLinks.vera.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm text-white/90"
                  >
                    {s.icon}
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">

        {/* Formulário de Avaliação */}
        <section>
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-4">
            Avalie a apresentação
          </h2>
          <DraveraEvaluationForm />
        </section>

        {/* Currículo */}
        <section>
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-4">
            Currículo
          </h2>
          <div className="rounded-2xl border border-border bg-white p-6 space-y-4 text-sm text-foreground">
            <div>
              <p className="font-semibold text-foreground mb-1">Formação</p>
              <ul className="space-y-1 text-muted">
                <li>Medicina — Universidade Federal de Minas Gerais (UFMG)</li>
                <li>Residência em Clínica Médica</li>
                <li>Especialização em Gastroenterologia</li>
              </ul>
            </div>
            <div className="h-px bg-border" />
            <div>
              <p className="font-semibold text-foreground mb-1">Atuação</p>
              <ul className="space-y-1 text-muted">
                <li>Médica Gastroenterologista</li>
                <li>Autora de 5 livros de referência em Gastroenterologia</li>
                <li>Palestrante em congressos médicos nacionais</li>
                <li>Instrutora na Nuvem Ensino</li>
              </ul>
            </div>
            <div className="h-px bg-border" />
            <div>
              <p className="font-semibold text-foreground mb-1">Foco clínico</p>
              <p className="text-muted">
                Doenças funcionais, motilidade digestiva, testes respiratórios, hepatologia
                e educação médica continuada em Gastroenterologia.
              </p>
            </div>
          </div>
        </section>

        {/* Agenda */}
        <section>
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-4">
            Próximos cursos e eventos
          </h2>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.title}
                className="rounded-2xl border border-border bg-white p-5 flex items-center justify-between gap-4"
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
                    <p className="text-xs text-muted mt-0.5">{event.location}</p>
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
        </section>

        {/* Redes sociais */}
        <section>
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-4">
            Conecte-se
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-white p-5">
              <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-3">
                Nuvem Ensino
              </p>
              <div className="space-y-2">
                {socialLinks.nuvemEnsino.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <span className="text-muted">{s.icon}</span>
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-white p-5">
              <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-3">
                Nuvem Medicina
              </p>
              <div className="space-y-2">
                {socialLinks.nuvemMedicina.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <span className="text-muted">{s.icon}</span>
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Livros */}
        <section>
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-4">
            Publicações
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            {books.map((book) => (
              <div key={book.file} className="flex flex-col gap-2">
                <div className="rounded-xl overflow-hidden border border-border bg-white shadow-sm aspect-[3/4]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/Livros/${encodeURIComponent(book.file)}`}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-muted leading-snug px-0.5">{book.title}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="text-center text-xs text-muted/60 pb-6">
          © {new Date().getFullYear()} Nuvem Ensino · Todos os direitos reservados
        </footer>
      </div>
    </div>
  );
}
