"use client";

import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, BookOpen, Video, Layers, User } from "lucide-react";
import { usePathname } from "next/navigation";

type Props = {
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
  initials: string;
};

const bottomTabs = [
  { label: "Início",     href: "/dashboard",                icon: LayoutDashboard },
  { label: "Cursos",     href: "/dashboard/cursos",         icon: BookOpen },
  { label: "Ao vivo",    href: "/dashboard/aulas-ao-vivo",  icon: Video },
  { label: "Flashcards", href: "/dashboard/flashcards",     icon: Layers },
  { label: "Perfil",     href: "/dashboard/perfil",         icon: User },
];

export default function MobileNav({ userImage, initials }: Props) {
  const pathname = usePathname();

  return (
    <>
      {/* ── Top bar mobile — só logo + avatar ── */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-border">
        <div className="flex items-center justify-between px-5 h-14">
          <Link href="/dashboard">
            <Image src="/logo.png" alt="NU.V.E.M ENSINO" width={100} height={78} className="h-7 w-auto" />
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-stretch">
          {bottomTabs.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
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
