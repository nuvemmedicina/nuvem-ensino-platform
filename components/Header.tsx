"use client";

import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { label: "Cursos", href: "/cursos" },
  { label: "Instrutores", href: "/instrutores" },
  { label: "Blog", href: "/blog" },
  { label: "Sobre", href: "/sobre" },
];

export function Header() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-primary/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-display text-2xl font-light italic text-accent group-hover:text-accent-hover transition-colors">
              Nuvem
            </span>
            <span className="font-display text-2xl font-semibold text-text-primary group-hover:text-accent transition-colors">
              Ensino
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-text-secondary hover:text-accent transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-text-secondary hover:text-accent transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/cursos"
              className="rounded-sm bg-accent px-5 py-2 text-sm font-semibold text-primary hover:bg-accent-hover transition-colors"
            >
              Ver Cursos
            </Link>
          </div>

          {/* Botão mobile */}
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            aria-label="Abrir menu"
            className="md:hidden p-2 text-text-secondary hover:text-accent transition-colors"
          >
            {menuAberto ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuAberto && (
        <div className="md:hidden border-t border-surface-border bg-primary-light px-6 py-4">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuAberto(false)}
                className="text-sm font-medium text-text-secondary hover:text-accent transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-surface-border" />
            <Link
              href="/login"
              onClick={() => setMenuAberto(false)}
              className="text-sm font-medium text-text-secondary hover:text-accent transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/cursos"
              onClick={() => setMenuAberto(false)}
              className="rounded-sm bg-accent px-5 py-2 text-center text-sm font-semibold text-primary hover:bg-accent-hover transition-colors"
            >
              Ver Cursos
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
