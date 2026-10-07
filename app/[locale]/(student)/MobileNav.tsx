"use client";

import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, BookOpen, Video, User, CalendarDays, Trophy } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

type Props = {
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
  initials: string;
  /** Nova área do aluno: os mesmos cinco itens do menu do computador. */
  nova?: boolean;
};

const bottomTabs = [
  { label: "Início",     href: "/dashboard",                icon: LayoutDashboard },
  { label: "Cursos",     href: "/dashboard/cursos",         icon: BookOpen },
  { label: "Ao vivo",    href: "/dashboard/aulas-ao-vivo",  icon: Video },
  { label: "Perfil",     href: "/dashboard/perfil",         icon: User },
];

const novasAbas = [
  { chave: "inicio",      href: "/dashboard",               icon: LayoutDashboard },
  { chave: "cursosCurto", href: "/dashboard/cursos",        icon: BookOpen },
  { chave: "agenda",      href: "/dashboard/aulas-ao-vivo", icon: CalendarDays },
  { chave: "conquistas",  href: "/dashboard/certificados",  icon: Trophy },
  { chave: "perfil",      href: "/dashboard/perfil",        icon: User },
] as const;

export default function MobileNav({ userImage, initials, nova = false }: Props) {
  const pathname = usePathname();
  const t = useTranslations("novaArea.menu");
  const abas = nova ? novasAbas.map((a) => ({ label: t(a.chave), href: a.href, icon: a.icon })) : bottomTabs;

  return (
    <>
      {/* ── Top bar mobile — só logo + avatar ── */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-border">
        <div className="flex items-center justify-between px-5 h-14">
          <Link href="/dashboard">
            <span className="flex items-center gap-2.5">
              <Image src="/logo-icone.png" alt="" width={40} height={40} className="w-10 h-10" priority />
              <span className="font-serif text-[22px] font-semibold text-primary leading-none">nuvem</span>
              <span className="sr-only">NU.V.E.M ENSINO</span>
            </span>
          </Link>
          <Link href="/dashboard/perfil" className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
            {userImage ? (
              <Image src={userImage} alt="Perfil" width={32} height={32} className="rounded-full w-full h-full object-cover" />
            ) : (
              <span className="font-sans text-xs font-bold text-primary">{initials}</span>
            )}
          </Link>
        </div>
      </header>

      {/* ── Bottom tab bar ── */}
      <nav aria-label={nova ? t("rotulo") : undefined} className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-stretch">
          {abas.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.includes(href.replace("/dashboard", "")));
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[52px] transition-colors ${
                  active ? "text-primary" : "text-muted"
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
                <span className={`font-sans ${nova ? "text-[11px]" : "text-[10px]"} ${active ? "font-bold" : "font-medium"}`}>
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
