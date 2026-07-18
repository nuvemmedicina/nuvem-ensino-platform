import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SignOutButton from "@/components/SignOutButton";
import { AdminSidebarNav } from "@/components/AdminSidebarNav";
import { getTranslations } from "next-intl/server";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.nav" });

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/admin");

  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") redirect("/dashboard");

  const initials = (session.user.name ?? session.user.email ?? "A")
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  // Only serializable values passed to client component
  const navItems = [
    { key: "overview",     href: "/admin",               exact: true,  label: t("overview") },
    { key: "courses",      href: "/admin/cursos",                       label: t("courses") },
    { key: "enrollments",  href: "/admin/matriculas",                   label: t("enrollments") },
    { key: "payments",     href: "/admin/pagamentos",                    label: "Pagamentos" },
    { key: "users",        href: "/admin/usuarios",                     label: t("users") },
    { key: "instructors",  href: "/admin/instrutores",                  label: t("instructors") },
    { key: "liveSessions", href: "/admin/aulas-ao-vivo",                label: t("liveSessions") },
    { key: "reports",      href: "/admin/relatorios",                   label: t("reports") },
    { key: "coupons",      href: "/admin/cupons",                        label: "Cupons" },
    { key: "liveLeads",   href: "/admin/live-leads",                    label: "Inscrições Live" },
    { key: "flashcards",  href: "/admin/flashcards",                    label: "Flashcards" },
    { key: "settings",     href: "/admin/configuracoes/pagamentos",     label: t("settings") },
    { key: "ai",           href: "/admin/configuracoes/ia",             label: "Config. IA" },
    { key: "rag",          href: "/admin/rag",                          label: "Base IA (RAG)" },
  ];

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-border shrink-0 sticky top-0 h-screen overflow-y-auto">

        {/* Logo + badge */}
        <div className="px-5 py-5">
          <Link href="/" className="block">
            <Image
              src="/logo.png"
              alt="NU.V.E.M ENSINO"
              width={120}
              height={94}
              className="h-8 w-auto"
            />
          </Link>
          <span className="mt-2 inline-flex items-center font-sans text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/8 border border-primary/20 px-2 py-0.5 rounded-md">
            Administrador
          </span>
        </div>

        <div className="mx-4 h-px bg-border" />

        {/* Nav */}
        <AdminSidebarNav items={navItems} />

        <div className="mx-4 h-px bg-border" />

        {/* User */}
        <div className="px-3 py-4">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="font-sans text-xs font-semibold text-primary">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-xs font-semibold text-foreground truncate">{session.user.name}</p>
              <p className="font-sans text-[10px] text-muted truncate">{session.user.email}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-40 bg-white border-b border-border shrink-0">
          <div className="flex items-center justify-between px-4 h-14">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="NU.V.E.M ENSINO"
                width={100}
                height={78}
                className="h-7 w-auto"
              />
            </Link>
            <div className="flex items-center gap-2">
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/8 border border-primary/20 px-2 py-0.5 rounded-md">
                Admin
              </span>
              <SignOutButton />
            </div>
          </div>
          {/* Nav row horizontal */}
          <nav className="flex overflow-x-auto gap-1 px-3 pb-2 scrollbar-none">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href as "/admin"}
                className="shrink-0 font-sans text-xs text-muted hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-background transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <div className="p-6 lg:p-10">{children}</div>
      </main>
    </div>
  );
}
