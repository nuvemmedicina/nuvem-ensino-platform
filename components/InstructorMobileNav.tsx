"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, TrendingUp, Radio } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";

type Props = { initials: string };

// Mesmas abas da sidebar, na ordem de uso no celular.
const bottomTabs = [
  { label: "Início",   href: "/instrutor",               icon: LayoutDashboard, exact: true },
  { label: "Cursos",   href: "/instrutor/cursos",        icon: BookOpen },
  { label: "Evolução", href: "/instrutor/evolucao",      icon: TrendingUp },
  { label: "Ao vivo",  href: "/instrutor/aulas-ao-vivo", icon: Radio },
] as const;

export default function InstructorMobileNav({ initials }: Props) {
  const pathname = usePathname();

  // O pathname vem prefixado com o locale (/pt/instrutor). Compara só o trecho
  // final para a aba ativa não depender do idioma.
  const path = pathname.replace(/^\/(pt|en|es)(?=\/|$)/, "") || "/";

  return (
    <>
      {/* ── Barra superior — logo, selo e sair ── */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-border">
        <div className="flex items-center justify-between gap-3 px-5 h-14">
          <Link href="/instrutor" className="shrink-0">
            <Image src="/logo.png" alt="NU.V.E.M ENSINO" width={100} height={78} className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/8 border border-primary/20 px-2 py-0.5 rounded-md shrink-0">
              Instrutor
            </span>
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="font-sans text-xs font-bold text-primary">{initials}</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* ── Abas inferiores ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch">
          {bottomTabs.map(({ label, href, icon: Icon, ...rest }) => {
            const exact = "exact" in rest && rest.exact;
            const active = exact ? path === href : path === href || path.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href as "/instrutor"}
                aria-current={active ? "page" : undefined}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
                  active ? "text-primary" : "text-muted"
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
                <span className={`font-sans text-[10px] ${active ? "font-bold" : "font-medium"}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
