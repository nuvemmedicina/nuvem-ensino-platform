"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";
import MobileNav from "./MobileNav";
import SidebarNav from "./SidebarNav";
import { NuveteWidget } from "./NuveteWidget";
import { usaNovaArea } from "@/lib/novaArea";

export default async function StudentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  await params;

  const session = await auth();
  if (!session) redirect("/entrar?callbackUrl=/dashboard");

  // Nova área do aluno: menu de cinco itens (ver lib/novaArea.ts)
  const nova = await usaNovaArea((session.user as { role?: string } | undefined)?.role);

  const initials = session.user?.name
    ? session.user.name
        .split(" ")
        .slice(0, 2)
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : "A";

  return (
    <div className="min-h-screen bg-white flex">
      {/* ── Sidebar desktop ── */}
      <aside className="hidden md:flex flex-col w-52 bg-white border-r border-border shrink-0 sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <Link href="/" className="flex items-center gap-3" aria-label="NU.V.E.M ENSINO">
            <Image src="/logo-icone.png" alt="" width={56} height={56} className="w-14 h-14 shrink-0" priority />
            <span className="flex flex-col leading-none">
              <span className="font-serif text-[26px] font-semibold text-primary">nuvem</span>
              <span className="font-sans text-xs font-medium uppercase tracking-[0.2em] text-muted mt-1">ensino</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <SidebarNav nova={nova} />

        {/* Suporte */}
        <div className="px-3 pb-2">
          <a
            href="https://wa.me/5531972291029"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-sans text-sm text-muted hover:text-foreground hover:bg-background transition-all"
          >
            <MessageCircle className="w-4 h-4 shrink-0 text-green-500" />
            Suporte
          </a>
        </div>

        {/* User */}
        <div className="px-3 py-4 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? ""}
                  width={32}
                  height={32}
                  className="rounded-full w-full h-full object-cover"
                />
              ) : (
                <span className="font-sans text-xs font-semibold text-primary">
                  {initials}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-xs font-semibold text-foreground truncate">
                {session.user?.name}
              </p>
              <p className="font-sans text-[10px] text-muted truncate">
                {session.user?.email}
              </p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile hamburger nav */}
        <MobileNav
          userName={session.user?.name ?? null}
          userEmail={session.user?.email ?? null}
          userImage={session.user?.image ?? null}
          initials={initials}
          nova={nova}
        />

        {/* Page content */}
        <div className="flex-1 p-6 lg:p-8 pb-24 md:pb-8">{children}</div>
      </main>

      {/* Nuvete — assistente de estudos IA */}
      <NuveteWidget userName={session.user?.name?.split(" ")[0] ?? "Aluno"} />
    </div>
  );
}
