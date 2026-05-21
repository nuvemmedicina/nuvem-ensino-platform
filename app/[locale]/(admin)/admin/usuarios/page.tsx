import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { UserFilters } from "./UserFilters";
import { UserEditRow } from "./UserEditRow";
import { getTranslations } from "next-intl/server";

type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; role?: string }>;
};

export default async function AdminUsuariosPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.users" });
  const dateLocale = locale === "en" ? "en-US" : locale === "es" ? "es-ES" : "pt-BR";
  const fmt = new Intl.DateTimeFormat(dateLocale, { day: "2-digit", month: "2-digit", year: "numeric" });

  const { q = "", role = "ALL" } = await searchParams;

  const where = {
    ...(q && {
      OR: [
        { name:  { contains: q, mode: "insensitive" as const } },
        { email: { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(role && role !== "ALL" && { role: role as Role }),
  };

  const session = await auth();
  const selfId = session?.user?.id ?? "";

  const [users, totals] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id:            true,
        name:          true,
        email:         true,
        role:          true,
        emailVerified: true,
        createdAt:     true,
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    }),
  ]);

  const totalAll       = totals.reduce((s, t) => s + t._count._all, 0);
  const totalStudents  = totals.find((t) => t.role === "STUDENT")?._count._all ?? 0;
  const totalInst      = totals.find((t) => t.role === "INSTRUCTOR")?._count._all ?? 0;

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl font-light text-foreground">{t("title")}</h1>
          <p className="font-sans text-sm text-muted mt-1">
            {users.length === 200
              ? t("limit200")
              : `${users.length === 1 ? t("countOne", { count: 1 }) : t("countPlural", { count: users.length })}${q || role !== "ALL" ? t("found") : t("registered")}`}
          </p>
        </div>
        <Suspense fallback={null}>
          <UserFilters />
        </Suspense>
      </div>

      {/* Cards de resumo (só quando não há filtro ativo) */}
      {!q && role === "ALL" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: t("totalLabel"),       value: totalAll },
            { label: t("studentsLabel"),    value: totalStudents },
            { label: t("instructorsLabel"), value: totalInst },
            { label: t("adminsLabel"),      value: totals.find((tot) => tot.role === "ADMIN")?._count._all ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface border border-border rounded-2xl px-5 py-4">
              <p className="font-sans text-2xl font-semibold text-foreground">{value}</p>
              <p className="font-sans text-xs text-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabela */}
      {users.length === 0 ? (
        <p className="font-sans text-sm text-muted">{t("none")}</p>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">
                  {t("colUser")}
                </th>
                <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">
                  {t("colType")}
                </th>
                <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden sm:table-cell">
                  {t("colEmailVerified")}
                </th>
                <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell">
                  {t("colEnrollments")}
                </th>
                <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden lg:table-cell">
                  {t("colRegistered")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <UserEditRow
                  key={u.id}
                  user={{
                    id:            u.id,
                    name:          u.name,
                    email:         u.email,
                    role:          u.role as Role,
                    emailVerified: !!u.emailVerified,
                    _count:        u._count,
                  }}
                  isSelf={u.id === selfId}
                  dateFormatted={fmt.format(new Date(u.createdAt))}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
