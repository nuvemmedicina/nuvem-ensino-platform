import Link from "next/link";

const cursos = [
  { label: "Manometria e pHmetria", href: "/cursos/manometria-phmetria" },
  { label: "Testes Respiratórios", href: "/cursos/testes-respiratorios" },
  { label: "Assoalho Pélvico", href: "/cursos/assoalho-pelvico" },
  { label: "Teste Respiratório H₂ CH₄", href: "/cursos/teste-respiratorio-online" },
];

const links = [
  { label: "Instrutores", href: "/instrutores" },
  { label: "Blog", href: "/blog" },
  { label: "Sobre", href: "/sobre" },
  { label: "Contato", href: "/contato" },
];

export function Footer() {
  return (
    <footer className="border-t border-surface-border bg-primary">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 lg:grid-cols-4">
          {/* Marca */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-display text-2xl font-light italic text-accent">Nuvem</span>
              <span className="font-display text-2xl font-semibold text-text-primary">Ensino</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              Educação médica continuada de excelência. Cursos presenciais e online
              para profissionais de saúde em Belo Horizonte e em todo o Brasil.
            </p>
            <div className="mt-5 flex flex-col gap-1 text-sm text-text-muted">
              <a href="mailto:cursos@nuvemensino.com.br" className="hover:text-accent transition-colors">
                cursos@nuvemensino.com.br
              </a>
              <a href="https://wa.me/5531997261029" className="hover:text-accent transition-colors">
                (31) 99726-1029
              </a>
              <span>Belo Horizonte — MG</span>
            </div>
          </div>

          {/* Cursos */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Cursos
            </h3>
            <ul className="mt-4 flex flex-col gap-2">
              {cursos.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-text-secondary hover:text-accent transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Plataforma
            </h3>
            <ul className="mt-4 flex flex-col gap-2">
              {links.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-text-secondary hover:text-accent transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-surface-border pt-8 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} NU.V.E.M Ensino — CNPJ 42.679.051/0001-31. Todos os direitos reservados.
          </p>
          <div className="flex gap-4 text-xs text-text-muted">
            <Link href="/privacidade" className="hover:text-accent transition-colors">
              Privacidade
            </Link>
            <Link href="/termos" className="hover:text-accent transition-colors">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
