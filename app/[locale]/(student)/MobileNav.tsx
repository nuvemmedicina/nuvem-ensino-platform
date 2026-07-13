"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  X,
  LayoutDashboard,
  BookOpen,
  Award,
  User,
  Video,
  MessageCircle,
  Users,
  LogOut,
} from "lucide-react";
import { usePathname } from "next/navigation";

type Props = {
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
  initials: string;
};

const navLinks = [
  { label: "Início",        href: "/dashboard",                icon: LayoutDashboard },
  { label: "Meus Cursos",   href: "/dashboard/cursos",         icon: BookOpen },
  { label: "Ao vivo",       href: "/dashboard/aulas-ao-vivo",  icon: Video },
  { label: "Certificados",  href: "/dashboard/certificados",   icon: Award },
  { label: "Perfil",        href: "/dashboard/perfil",         icon: User },
  { label: "Comunidade",    href: "/dashboard/comunidade",     icon: Users },
];

export default function MobileNav({ userName, userEmail, userImage, initials }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fecha ao navegar
  useEffect(() => { setOpen(false); }, [pathname]);

  // Bloqueia scroll do body quando aberto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* ── Top bar mobile ── */}
      <header className="md:hidden sticky top-0 z-40 bg-surface border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/">
            <Image src="/logo.png" alt="NU.V.E.M ENSINO" width={100} height={78} className="h-8 w-auto" />
          </Link>

          <button
            onClick={() => setOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-background text-foreground hover:bg-border/40 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Drawer ── */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-72 bg-surface flex flex-col
          shadow-2xl transition-transform duration-300 ease-out md:hidden
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header do drawer */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <Link href="/" onClick={() => setOpen(false)}>
            <Image src="/logo.png" alt="NU.V.E.M ENSINO" width={100} height={78} className="h-8 w-auto" />
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-background transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
              {userImage ? (
                <Image src={userImage} alt={userName ?? ""} width={44} height={44} className="rounded-full w-full h-full object-cover" />
              ) : (
                <span className="font-sans text-sm font-bold text-primary">{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-sans text-sm font-semibold text-foreground truncate">{userName}</p>
              <p className="font-sans text-[11px] text-muted truncate">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          {navLinks.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl mb-0.5 font-sans text-sm transition-all ${
                  active
                    ? "bg-primary/8 text-primary font-semibold"
                    : "text-muted hover:text-foreground hover:bg-background"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  active ? "bg-primary/15" : "bg-background"
                }`}>
                  <Icon className={`w-4 h-4 ${active ? "text-primary" : "text-muted"}`} />
                </div>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-border space-y-1">
          <a
            href="https://wa.me/5531722910291"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 px-4 py-3 rounded-xl font-sans text-sm text-muted hover:text-foreground hover:bg-background transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4 text-green-500" />
            </div>
            Suporte via WhatsApp
          </a>

          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-sans text-sm text-muted hover:text-red-600 hover:bg-red-50 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4" />
              </div>
              Sair
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
