import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, LayoutDashboard, Users, Video, LogOut } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";

const navLinks = [
  { label: "VisÃ£o geral", href: "/admin", icon: LayoutDashboard },
  { label: "Cursos", href: "/admin/cursos", icon: BookOpen },
  { label: "MatrÃ­culas", href: "/admin/matriculas", icon: Users },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/admin");

  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex flex-col w-60 bg-canvas shrink-0 sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="NU.V.E.M Ensino"
              width={100}
              height={78}
              className="h-9 w-auto brightness-0 invert opacity-90"
            />
          </Link>
          <span className="mt-2 inline-block font-sans text-[10px] font-bold uppercase tracking-widest text-accent/70 bg-accent/10 px-2 py-0.5 rounded">
            Admin
          </span>
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

        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary/40 flex items-center justify-center shrink-0">
              <span className="font-sans text-xs font-semibold text-white">
                {session.user?.name?.[0]?.toUpperCase() ?? "A"}
              </span>
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

      <main className="flex-1 min-w-0">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

