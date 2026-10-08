"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard, BookOpen, User, CalendarDays, Trophy,
} from "lucide-react";

// Menu da área do aluno: cinco itens. Flashcards e comunidade moram dentro
// de cada curso (abas Avaliações e Comunidade).
const links = [
  { chave: "inicio",     href: "/dashboard",               icon: LayoutDashboard },
  { chave: "cursos",     href: "/dashboard/cursos",        icon: BookOpen },
  { chave: "agenda",     href: "/dashboard/aulas-ao-vivo", icon: CalendarDays },
  { chave: "conquistas", href: "/dashboard/certificados",  icon: Trophy },
  { chave: "perfil",     href: "/dashboard/perfil",        icon: User },
] as const;

export default function SidebarNav() {
  const pathname = usePathname();
  const t = useTranslations("novaArea.menu");

  return (
    <nav aria-label={t("rotulo")} className="flex-1 px-3 py-2 flex flex-col gap-0.5">
      {links.map(({ chave, href, icon: Icon }) => {
        const active =
          href === "/dashboard"
            ? pathname === "/dashboard" || pathname === "/pt/dashboard" || pathname === "/en/dashboard" || pathname === "/es/dashboard"
            : pathname.includes(href.replace("/dashboard", ""));

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 px-3 min-h-[44px] text-[15px] rounded-xl font-sans transition-all duration-150 ${
              active
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted hover:text-foreground hover:bg-primary/6 hover:translate-x-0.5"
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${active ? "text-primary" : ""}`} strokeWidth={active ? 2.5 : 1.8} />
            {t(chave)}
          </Link>
        );
      })}
    </nav>
  );
}
