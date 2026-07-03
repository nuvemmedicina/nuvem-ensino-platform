import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, BookOpen, Award, User, Video, MessageCircle, Users } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";
import { getTranslations } from "next-intl/server";

export default async function StudentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.nav" });

  const session = await auth();
  if (!session) redirect("/entrar?callbackUrl=/dashboard");

  const navLinks = [
    { label: t("panel"),       href: "/dashboard",                icon: LayoutDashboard },
    { label: t("myCourses"),   href: "/dashboard/cursos",         icon: BookOpen },
    { label: t("liveLessons"), href: "/dashboard/aulas-ao-vivo",  icon: Video },
    { label: t("certificates"),href: "/dashboard/certificados",   icon: Award },
    { label: t("profile"),     href: "/dashboard/perfil",         icon: User },
    { label: "Comunidade",     href: "/dashboard/comunidade",     icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Sidebar desktop ── */}
      <aside className="hidden md:flex flex-col w-60 bg-canvas shrink-0 sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="NU.V.E.M ENSINO"
              width={100}
              height={78}
              className="h-9 w-auto brightness-0 invert opacity-90"
            />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navLinks.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-sans text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* WhatsApp suporte */}
        <div className="px-3 pb-2">
          <a
            href="https://wa.me/5531722910291"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-sans text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
          >
            <MessageCircle className="w-4 h-4 shrink-0 text-green-400" />
            Suporte via WhatsApp
          </a>
        </div>

        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary/40 flex items-center justify-center shrink-0">
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? ""}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <span className="font-sans text-xs font-semibold text-white">
                  {session.user?.name?.[0]?.toUpperCase() ?? "A"}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-xs font-medium text-white/80 truncate">
                {session.user?.name}
              </p>
              <p className="font-sans text-[10px] text-white/40 truncate">
                {session.user?.email}
              </p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-40 bg-canvas border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between px-4 h-14">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="NU.V.E.M ENSINO"
                width={100}
                height={78}
                className="h-8 w-auto brightness-0 invert opacity-90"
              />
            </Link>
            <SignOutButton />
          </div>
          {/* Nav row */}
          <nav className="flex overflow-x-auto gap-1 px-3 pb-2 scrollbar-none">
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href as "/dashboard" | "/dashboard/cursos" | "/dashboard/aulas-ao-vivo" | "/dashboard/certificados" | "/dashboard/perfil"}
                className="shrink-0 font-sans text-xs text-white/60 hover:text-white/90 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>

        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
