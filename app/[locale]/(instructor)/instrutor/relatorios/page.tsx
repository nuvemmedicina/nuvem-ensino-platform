import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const methodColor: Record<string, string> = {
  STRIPE:              "text-blue-600 bg-blue-500/10 border-blue-500/20",
  MERCADO_PAGO_PIX:    "text-green-600 bg-green-500/10 border-green-500/20",
  MERCADO_PAGO_BOLETO: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  MERCADO_PAGO_CARD:   "text-purple-600 bg-purple-500/10 border-purple-500/20",
  FREE:                "text-muted bg-border/50 border-border",
};

const methodLabel: Record<string, string> = {
  STRIPE:              "Cartão",
  MERCADO_PAGO_PIX:    "PIX",
  MERCADO_PAGO_BOLETO: "Boleto",
  MERCADO_PAGO_CARD:   "Parcelado",
  FREE:                "Gratuito",
};

function toNum(v: unknown): number {
  return v === null || v === undefined ? 0 : Number(v);
}

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string; to?: string; courseId?: string }>;
};

export default async function InstructorRelatoriosPage({ params, searchParams }: Props) {
  await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  // Busca o perfil de instrutor
  const instructor = await prisma.instructor.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!instructor) redirect("/instrutor");

  const { from, to, courseId } = await searchParams;
  const fromDate = from ? new Date(from + "T00:00:00") : undefined;
  const toDate   = to   ? new Date(to   + "T23:59:59") : undefined;

  const fmtBRL  = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const fmtDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const courseFilter = {
    OR: [
      { instructorId: instructor.id },
      { modules: { some: { instructors: { some: { instructorId: instructor.id } } } } },
    ],
  };

  // Cursos do instrutor (para o filtro)
  const myCourses = await prisma.course.findMany({
    where: courseFilter,
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  const myCourseIds = myCourses.map((c) => c.id);

  // Pagamentos apenas dos próprios cursos
  const payments = await prisma.payment.findMany({
    where: {
      status: "PAID",
      enrollment: {
        courseId: courseId && myCourseIds.includes(courseId)
          ? courseId
          : { in: myCourseIds },
      },
      ...(fromDate || toDate
        ? { paidAt: { ...(fromDate && { gte: fromDate }), ...(toDate && { lte: toDate }) } }
        : {}),
    },
    select: {
      id:     true,
      amount: true,
      method: true,
      paidAt: true,
      enrollment: {
        select: {
          courseId: true,
          user:   { select: { name: true, email: true } },
          course: { select: { title: true } },
        },
      },
    },
    orderBy: { paidAt: "desc" },
    take: 1000,
  });

  const totalReceita    = payments.reduce((s, p) => s + toNum(p.amount), 0);
  const totalPagamentos = payments.length;
  const mediaValor      = totalPagamentos > 0 ? totalReceita / totalPagamentos : 0;

  // Receita agrupada por curso
  const receitaPorCurso = new Map<string, { title: string; total: number; count: number }>();
  for (const p of payments) {
    const { courseId: cid, course } = p.enrollment;
    const existing = receitaPorCurso.get(cid);
    if (existing) {
      existing.total += toNum(p.amount);
      existing.count += 1;
    } else {
      receitaPorCurso.set(cid, { title: course.title, total: toNum(p.amount), count: 1 });
    }
  }
  const resumoPorCurso = [...receitaPorCurso.values()].sort((a, b) => b.total - a.total);

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-light text-foreground">Relatório de Vendas</h1>
        <p className="font-sans text-sm text-muted mt-1">Matrículas e faturamento dos seus cursos</p>
      </div>

      {/* Filtros */}
      <form method="GET" className="bg-surface border border-border rounded-2xl p-5 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              De
            </label>
            <input
              name="from"
              type="date"
              defaultValue={from ?? ""}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Até
            </label>
            <input
              name="to"
              type="date"
              defaultValue={to ?? ""}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Curso
            </label>
            <select
              name="courseId"
              defaultValue={courseId ?? ""}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/50"
            >
              <option value="">Todos os meus cursos</option>
              {myCourses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="font-sans text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            Filtrar
          </button>
          {(from || to || courseId) && (
            <a
              href="/instrutor/relatorios"
              className="font-sans text-sm text-muted hover:text-foreground transition-colors"
            >
              Limpar
            </a>
          )}
        </div>
      </form>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-2xl px-5 py-4">
          <p className="font-sans text-xs text-muted uppercase tracking-wider mb-1">Faturamento</p>
          <p className="font-serif text-2xl font-medium text-foreground">{fmtBRL.format(totalReceita)}</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl px-5 py-4">
          <p className="font-sans text-xs text-muted uppercase tracking-wider mb-1">Matrículas pagas</p>
          <p className="font-serif text-2xl font-medium text-foreground">{totalPagamentos}</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl px-5 py-4">
          <p className="font-sans text-xs text-muted uppercase tracking-wider mb-1">Ticket médio</p>
          <p className="font-serif text-2xl font-medium text-foreground">{fmtBRL.format(mediaValor)}</p>
        </div>
      </div>

      {/* Resumo por curso (só quando não filtrado por curso específico) */}
      {!courseId && resumoPorCurso.length > 1 && (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-border bg-background">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">
              Faturamento por curso
            </p>
          </div>
          <div className="divide-y divide-border">
            {resumoPorCurso.map((c) => (
              <div key={c.title} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-sans text-sm text-foreground line-clamp-1">{c.title}</p>
                  <p className="font-sans text-xs text-muted">{c.count} matrícula{c.count !== 1 ? "s" : ""}</p>
                </div>
                <p className="font-sans text-sm font-semibold text-foreground shrink-0 ml-4">
                  {fmtBRL.format(c.total)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabela de pagamentos */}
      {payments.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl px-5 py-12 text-center">
          <p className="font-sans text-sm text-muted">Nenhum pagamento encontrado para o período.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">Data</th>
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">Aluno</th>
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell">Curso</th>
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden sm:table-cell">Método</th>
                  <th className="px-5 py-3 text-right font-sans text-xs font-semibold text-muted uppercase tracking-wider">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="font-sans text-xs text-muted">
                        {p.paidAt ? fmtDate.format(new Date(p.paidAt)) : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-sans text-sm font-medium text-foreground leading-tight">
                        {p.enrollment.user.name ?? "—"}
                      </p>
                      <p className="font-sans text-xs text-muted">{p.enrollment.user.email}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="font-sans text-sm text-foreground line-clamp-1">
                        {p.enrollment.course.title}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className={`font-sans text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${methodColor[p.method] ?? methodColor.FREE}`}>
                        {methodLabel[p.method] ?? p.method}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <span className="font-sans text-sm font-semibold text-foreground">
                        {fmtBRL.format(toNum(p.amount))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-background">
                  <td colSpan={4} className="px-5 py-3 font-sans text-sm font-semibold text-muted">
                    {totalPagamentos} pagamento{totalPagamentos !== 1 ? "s" : ""}
                  </td>
                  <td className="px-5 py-3 text-right font-sans text-sm font-bold text-foreground">
                    {fmtBRL.format(totalReceita)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
