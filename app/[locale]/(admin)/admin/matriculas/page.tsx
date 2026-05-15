import { prisma } from "@/lib/prisma";

const statusLabel: Record<string, { label: string; color: string }> = {
  ACTIVE:    { label: "Ativa",      color: "text-green-600 bg-green-500/10 border-green-500/20" },
  COMPLETED: { label: "Concluída",  color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
  CANCELLED: { label: "Cancelada",  color: "text-muted bg-border/50 border-border" },
  REFUNDED:  { label: "Reembolsada", color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
};

export default async function AdminMatriculasPage() {
  const enrollments = await prisma.enrollment.findMany({
    include: {
      user:   { select: { name: true, email: true } },
      course: { select: { title: true, slug: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-light text-foreground">Matrículas</h1>
        <p className="font-sans text-sm text-muted mt-1">{enrollments.length} matrículas no total</p>
      </div>

      {enrollments.length === 0 ? (
        <p className="font-sans text-sm text-muted">Nenhuma matrícula ainda.</p>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">Aluno</th>
                <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">Curso</th>
                <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden sm:table-cell">Data</th>
                <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {enrollments.map((e) => {
                const st = statusLabel[e.status] ?? statusLabel.ACTIVE;
                return (
                  <tr key={e.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-sans text-sm font-medium text-foreground">{e.user.name}</p>
                      <p className="font-sans text-xs text-muted">{e.user.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-sans text-sm text-foreground line-clamp-1">{e.course.title}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="font-sans text-xs text-muted">
                        {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(e.enrolledAt))}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`font-sans text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${st.color}`}>
                        {st.label}
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
