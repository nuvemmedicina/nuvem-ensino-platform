"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

export function SidebarNavLink({
  href,
  icon: Icon,
  label,
  exact = false,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
}) {
  const pathname = usePathname();
  // Strip locale prefix for comparison (e.g. /en/admin → /admin)
  const normalized = pathname.replace(/^\/(pt|en|es)/, "") || "/";
  const active = exact ? normalized === href : normalized === href || normalized.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`
        group flex items-center gap-3 px-3 py-2.5 rounded-xl font-sans text-sm transition-all
        ${active
          ? "bg-white/10 text-white font-medium"
          : "text-white/55 hover:text-white hover:bg-white/5"
        }
      `}
    >
      <Icon
        className={`w-4 h-4 shrink-0 transition-colors ${active ? "text-accent" : "text-white/40 group-hover:text-white/70"}`}
      />
      {label}
      {active && (
        <span className="ml-auto w-1 h-1 rounded-full bg-accent" />
      )}
    </Link>
  );
}
