"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Video, BarChart2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  overview:     LayoutDashboard,
  courses:      BookOpen,
  liveSessions: Video,
  reports:      BarChart2,
};

type NavItem = { key: string; href: string; exact?: boolean; label: string };

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const normalized = pathname.replace(/^\/(pt|en|es)/, "") || "/";
  const active = item.exact
    ? normalized === item.href
    : normalized === item.href || normalized.startsWith(item.href + "/");

  const Icon = ICONS[item.key] ?? BookOpen;

  return (
    <Link
      href={item.href}
      className={`
        group flex items-center gap-3 px-3 py-2.5 rounded-xl font-sans text-sm transition-all
        ${active
          ? "bg-white/10 text-white font-medium"
          : "text-white/55 hover:text-white hover:bg-white/5"
        }
      `}
    >
      <Icon
        className={`w-4 h-4 shrink-0 transition-colors ${
          active ? "text-teal-400" : "text-white/40 group-hover:text-white/70"
        }`}
      />
      {item.label}
      {active && <span className="ml-auto w-1 h-1 rounded-full bg-teal-400" />}
    </Link>
  );
}

export function InstructorSidebarNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
      {items.map((item) => (
        <NavLink key={item.href} item={item} />
      ))}
    </nav>
  );
}
