import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, BookOpen, Video, BarChart2 } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";
import { SidebarNavLink } from "@/components/SidebarNavLink";

const navItems = [
  { label: "Visão Geral",   href: "/instrutor",               icon: LayoutDashboard, exact: true },
  { label: "Meus Cursos",   href: "/instrutor/cursos",        icon: BookOpen },
  { label: "Aulas ao Vivo", href: "/instrutor/aulas-ao-vivo", icon: Video },
  { label: "Relatórios",    href: "/instrutor/relatorios",    icon: BarChart2 },
];

export default async function InstructorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/instrutor");

  const role = (session.user as { role?: string }).role;
  if (role !== "INSTRUCTOR") redirect("/dashboard");

  const initials = (session.user.name ?? session.user.email ?? "I")
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-canvas shrink-0 sticky top-0 h-screen overflow-y-auto">

        {/* Logo area */}
        <div className="px-6 pt-7 pb-5">
          <Link href="/" className="block">
            <Image
              src="/logo.png"
              alt="NU.V.E.M Ensino"
              width={160}
              height={125}
              className="h-16 w-auto brightness-0 invert opacity-95"
            />
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center font-sans text-[10px] font-bold uppercase tracking-widest text-teal-400 bg-teal-400/15 border border-teal-400/25 px-2.5 py-1 rounded-md">
              Instrutor
            </span>
          </div>
        </div>

        <div className="mx-4 h-px bg-white/8" />

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {navItems.map(({ label, href, icon, exact }) => (
            <SidebarNavLink
              key={href}
              href={href}
              icon={icon}
              label={label}
              exact={exact}
            />
          ))}
        </nav>

        <div className="mx-4 h-px bg-white/8" />

        {/* User */}
        <div className="px-3 py-4">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-teal-500/30 flex items-center justify-center shrink-0 ring-1 ring-white/10">
              <span className="font-sans text-xs font-semibold text-white">
                {initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-xs font-medium text-white/85 truncate">
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

      {/* Main */}
      <main className="flex-1 min-w-0">
        <div className="p-6 lg:p-10">{children}</div>
      </main>
    </div>
  );
}
