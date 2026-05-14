import Link from "next/link";

const footerLinks = {
  Plataforma: [
    { label: "Cursos", href: "/cursos" },
    { label: "Sobre", href: "/sobre" },
    { label: "Planos", href: "/planos" },
  ],
  Suporte: [
    { label: "FAQ", href: "/faq" },
    { label: "Contato", href: "/contato" },
  ],
  Legal: [
    { label: "Privacidade", href: "/privacidade" },
    { label: "Termos de Uso", href: "/termos" },
  ],
};

export default function Footer() {
  return (
    <footer className="w-full bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-1 w-fit">
              <span className="font-serif text-2xl font-semibold text-white tracking-tight">
                Nuvem
              </span>
              <span className="font-sans text-2xl font-light text-secondary-light tracking-tight">
                Ensino
              </span>
            </Link>
            <p className="font-sans text-sm text-primary-foreground/70 leading-relaxed max-w-xs">
              Transforme sua carreira com cursos criados por especialistas do mercado.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="flex flex-col gap-3">
              <h3 className="font-sans text-xs font-semibold uppercase tracking-widest text-primary-foreground/50">
                {category}
              </h3>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-sans text-sm text-primary-foreground/80 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-primary-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-sans text-xs text-primary-foreground/50">
            © {new Date().getFullYear()} Nuvem Ensino. Todos os direitos reservados.
          </p>
          <p className="font-sans text-xs text-primary-foreground/30">
            Feito com dedicação para sua aprendizagem
          </p>
        </div>
      </div>
    </footer>
  );
}
