"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Video, Award, User, Users, Layers,
} from "lucide-react";

const navLinks = [
  { label: "Início",       href: "/dashboard",                icon: LayoutDashboard },
  { label: "Meus Cursos",  href: "/dashboard/cursos",         icon: BookOpen },
  { label: "Ao vivo",      href: "/dashboard/aulas-ao-vivo",  icon: Video },
  { label: "Flashcards",   href: "/dashboard/flashcards",     icon: Layers },
  { label: "Certificados", href: "/dashboard/certificados",   icon: Award },
  { label: "Perfil",       href: "/dashboard/perfil",         icon: User },
  { label: "Comunidade",   href: "/dashboard/comunidade",     icon: Users },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5">
      {navLinks.map(({ label, href, icon: Icon }) => {
        const active =
          href === "/dashboard"
            ? pathname === "/dashboard" || pathname === "/pt/dashboard" || pathname === "/en/dashboard"
            : pathname.includes(href.replace("/dashboard", ""));

        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-sans text-sm transition-all ${
              active
                ? "bg-primary/8 text-primary font-semibold"
                : "text-muted hover:text-foreground hover:bg-background"
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${active ? "text-primary" : ""}`} strokeWidth={active ? 2.5 : 1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
