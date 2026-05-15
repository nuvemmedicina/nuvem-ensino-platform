import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { UserFilters } from "./UserFilters";
import { CheckCircle, XCircle } from "lucide-react";

type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";

const roleLabel: Record<Role, { label: string; color: string }> = {
  STUDENT:    { label: "Aluno",     color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
  INSTRUCTOR: { label: "Instrutor", color: "text-teal-600 bg-teal-500/10 border-teal-500/20" },
  ADMIN:      { label: "Admin",     color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
};

const fmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

type Props = { searchParams: Promise<{ q?: string; role?: string }> };

export default async function AdminUsuariosPage({ searchParams }: Props) {
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
          <h1 className="font-serif text-3xl font-light text-foreground">Usuários</h1>
          <p className="font-sans text-sm text-muted mt-1">
            {users.length === 200
              ? "200+ resultados — refine a busca para ver mais"
              : `${users.length} ${users.length === 1 ? "usuário" : "usuários"}${q || role !== "ALL" ? " encontrados" : " cadastrados"}`}
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
            { label: "Total",        value: totalAll },
            { label: "Alunos",       value: totalStudents },
            { label: "Instrutores",  value: totalInst },
            { label: "Administradores", value: totals.find((t) => t.role === "ADMIN")?._count._all ?? 0 },
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
        <p className="font-sans text-sm text-muted">Nenhum usuário encontrado.</p>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden sm:table-cell">
                  E-mail verificado
                </th>
                <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell">
                  Matrículas
                </th>
                <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden lg:table-cell">
                  Cadastro
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => {
                const rl = roleLabel[u.role as Role] ?? roleLabel.STUDENT;
                return (
                  <tr key={u.id} className="hover:bg-background/50 transition-colors">
                    {/* Nome + email */}
                    <td className="px-5 py-3.5">
                      <p className="font-sans text-sm font-medium text-foreground leading-tight">
                        {u.name ?? "—"}
                      </p>
                      <p className="font-sans text-xs text-muted">{u.email}</p>
                    </td>

                    {/* Role badge */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`font-sans text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${rl.color}`}
                      >
                        {rl.label}
                      </span>
                    </td>

                    {/* E-mail verificado */}
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      {u.emailVerified ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400/70" />
                      )}
                    </td>

                    {/* Matrículas */}
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="font-sans text-sm text-foreground">
                        {u._count.enrollments}
                      </span>
                    </td>

                    {/* Data de cadastro */}
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="font-sans text-xs text-muted">
                        {fmt.format(new Date(u.createdAt))}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
