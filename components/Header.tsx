"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LocaleSwitcher from "@/components/LocaleSwitcher";

type InternalHref = "/cursos" | "/sobre" | "/instrutores" | "/entrar" | "/cadastro" | "/faq" | "/";

const internalLinks: { labelKey: "courses" | "about"; href: InternalHref }[] = [
  { labelKey: "about", href: "/sobre" },
  { labelKey: "courses", href: "/cursos" },
];

const externalLinks: { labelKey: "blog" | "nuchemMedicina"; href: string }[] = [
  { labelKey: "blog", href: "https://nuvemmedicina.com.br/blog/" },
  { labelKey: "nuchemMedicina", href: "https://nuvemmedicina.com.br/" },
];

export default function Header() {
  const t = useTranslations("nav");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="w-full sticky top-0 z-50" style={{ backdropFilter: "blur(16px)" }}>
      {/* ── Barra de anúncio ── */}
      <div className="bg-amber-500 px-4 py-2 text-center">
        <p className="font-sans text-xs font-semibold text-amber-950">
          🎯 <span className="font-bold">1° Lote até 19/07/2026</span> — Curso DICI com 10% de desconto. Cupom{" "}
          <span className="font-mono font-bold bg-amber-950/15 px-1.5 py-0.5 rounded tracking-widest">DICI10</span>
          {" "}no checkout.{" "}
          <Link
            href={{ pathname: "/cursos/[slug]", params: { slug: "dici-neurogastroenterologia-2026" } }}
            className="underline underline-offset-2 hover:no-underline"
          >
            Saiba mais →
          </Link>
        </p>
      </div>

      <div className="border-b border-border" style={{ background: "rgba(255,255,255,0.85)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="shrink-0 group">
            <Image
              src="/logo.png"
              alt="NU.V.E.M ENSINO"
              width={120}
              height={94}
              className="h-11 w-auto transition-opacity duration-200 group-hover:opacity-80"
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {internalLinks.map(({ labelKey, href }) => (
              <Link
                key={href}
                href={href}
                className="relative group font-sans text-sm font-medium text-foreground hover:text-primary transition-colors duration-200"
              >
                {t(labelKey)}
                <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] bg-primary group-hover:w-full transition-all duration-300 rounded-full" />
              </Link>
            ))}
            {externalLinks.map(({ labelKey, href }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="relative group font-sans text-sm font-medium text-foreground hover:text-primary transition-colors duration-200"
              >
                {t(labelKey)}
                <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] bg-primary group-hover:w-full transition-all duration-300 rounded-full" />
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <LocaleSwitcher />
            <Link
              href="/entrar"
              className="group relative overflow-hidden font-sans text-sm font-medium px-5 py-2 rounded-full bg-primary text-primary-foreground hover:shadow-[0_4px_20px_rgba(0,71,94,0.35)] hover:scale-[1.03] transition-all duration-200"
            >
              <span className="relative z-10">{t("signIn")}</span>
              <span className="absolute inset-0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
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
