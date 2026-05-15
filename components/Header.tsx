"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LocaleSwitcher from "@/components/LocaleSwitcher";

type InternalHref = "/cursos" | "/sobre" | "/instrutores" | "/entrar" | "/cadastro" | "/faq" | "/";

const internalLinks: { labelKey: "courses" | "about"; href: InternalHref }[] = [
  { labelKey: "courses", href: "/cursos" },
  { labelKey: "about", href: "/sobre" },
];

const externalLinks: { labelKey: "blog" | "nuchemMedicina"; href: string }[] = [
  { labelKey: "blog", href: "https://nuvemmedicina.com.br/blog/" },
  { labelKey: "nuchemMedicina", href: "https://nuvemmedicina.com.br/" },
];

export default function Header() {
  const t = useTranslations("nav");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="w-full bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="shrink-0">
            <Image
              src="/logo.png"
              alt="NU.V.E.M Ensino"
              width={120}
              height={94}
              className="h-11 w-auto"
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {internalLinks.map(({ labelKey, href }) => (
              <Link
                key={href}
                href={href}
                className="font-sans text-sm font-medium text-foreground hover:text-primary-light transition-colors"
              >
                {t(labelKey)}
              </Link>
            ))}
            {externalLinks.map(({ labelKey, href }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm font-medium text-foreground hover:text-primary-light transition-colors"
              >
                {t(labelKey)}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <LocaleSwitcher />
            <Link
              href="/entrar"
              className="font-sans text-sm font-medium px-5 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary-dark transition-colors"
            >
              {t("signIn")}
            </Link>
          </div>

          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={t("openMenu")}
          >
            <span className={`block w-6 h-0.5 bg-foreground transition-transform ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-6 h-0.5 bg-foreground transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-6 h-0.5 bg-foreground transition-transform ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-surface">
          <nav className="flex flex-col px-4 py-4 gap-4">
            {internalLinks.map(({ labelKey, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="font-sans text-sm font-medium text-foreground hover:text-primary-light transition-colors"
              >
                {t(labelKey)}
              </Link>
            ))}
            {externalLinks.map(({ labelKey, href }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm font-medium text-foreground hover:text-primary-light transition-colors"
              >
                {t(labelKey)}
              </a>
            ))}
            <Link
              href="/entrar"
              onClick={() => setMenuOpen(false)}
              className="font-sans text-sm font-medium px-5 py-2 rounded-full bg-primary text-primary-foreground text-center hover:bg-primary-dark transition-colors"
            >
              {t("signIn")}
            </Link>
            <div className="pt-2 border-t border-border">
              <LocaleSwitcher />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
