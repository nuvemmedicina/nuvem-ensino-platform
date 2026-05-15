import { prisma } from "@/lib/prisma";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// ── Formatadores ─────────────────────────────────────────────────────────────

const fmtBRL   = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate  = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtMonth = new Intl.DateTimeFormat("pt-BR", { month: "short" });

// ── Badges de método de pagamento ─────────────────────────────────────────────

const methodLabel: Record<string, { label: string; color: string }> = {
  STRIPE:              { label: "Stripe",  color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
  MERCADO_PAGO_PIX:    { label: "PIX",     color: "text-green-600 bg-green-500/10 border-green-500/20" },
  MERCADO_PAGO_BOLETO: { label: "Boleto",  color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
  MERCADO_PAGO_CARD:   { label: "Cartão",  color: "text-purple-600 bg-purple-500/10 border-purple-500/20" },
  FREE:                { label: "Grátis",  color: "text-muted bg-border/50 border-border" },
};

// ── Delta badge ───────────────────────────────────────────────────────────────

function Delta({ value }: { value: number | null }) {
  if (value === null) return null;
  if (value === 0)
    return (
      <span className="flex items-center gap-0.5 font-sans text-xs text-muted">
        <Minus className="w-3 h-3" /> 0%
      </span>
    );
  const positive = value > 0;
  return (
    <span className={`flex items-center gap-0.5 font-sans text-xs font-medium ${positive ? "text-green-600" : "text-red-500"}`}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positive ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function toNum(val: unknown): number {
  if (val === null || val === undefined) return 0;
  return Number(val);
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminOverviewPage() {
  const now             = new Date();
  const startThisMonth  = new Date(now.getFullYear(), now.getMonth(), 1);
  const startLastMonth  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endLastMonth    = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const start6MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const start30DaysAgo  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const start60DaysAgo  = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    revTotal,
    revThisMonth,
    revLastMonth,
    activeEnrollments,
    newStudents30d,
    newStudentsPrev30d,
    totalPaidCount,
    totalNonFreeAttempts,
    paymentsByMethod,
    paymentsLast6Mo,
    topCourses,
    recentPayments,
  ] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),

    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "PAID", paidAt: { gte: startThisMonth } },
    }),

    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "PAID", paidAt: { gte: startLastMonth, lte: endLastMonth } },
    }),

    prisma.enrollment.count({ where: { status: "ACTIVE" } }),

    prisma.user.count({ where: { role: "STUDENT", createdAt: { gte: start30DaysAgo } } }),

    prisma.user.count({
      where: { role: "STUDENT", createdAt: { gte: start60DaysAgo, lt: start30DaysAgo } },
    }),

    prisma.payment.count({ where: { status: "PAID" } }),

    prisma.payment.count({ where: { method: { not: "FREE" } } }),

    prisma.payment.groupBy({
      by: ["method"],
      _count: { _all: true },
      where: { status: "PAID" },
      orderBy: { _count: { method: "desc" } },
    }),

    prisma.payment.findMany({
      where: { status: "PAID", paidAt: { gte: start6MonthsAgo } },
      select: { amount: true, paidAt: true },
    }),

    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      select: {
        title: true,
        _count: { select: { enrollments: true } },
        enrollments: {
          select: {
            payments: { where: { status: "PAID" }, select: { amount: true } },
          },
        },
      },
      orderBy: { enrollments: { _count: "desc" } },
      take: 5,
    }),

    prisma.payment.findMany({
      where: { status: "PAID" },
      select: {
        amount: true, method: true, paidAt: true,
        enrollment: {
          select: {
            user:   { select: { name: true, email: true } },
            course: { select: { title: true } },
          },
        },
      },
      orderBy: { paidAt: "desc" },
      take: 8,
    }),
  ]);

  // ── Cálculos JS ──────────────────────────────────────────────────────────────

  const revThisMonthVal = toNum(revThisMonth._sum.amount);
  const revLastMonthVal = toNum(revLastMonth._sum.amount);
  const revTotalVal     = toNum(revTotal._sum.amount);
  const deltaRev        = pctDelta(revThisMonthVal, revLastMonthVal);
  const deltaStudents   = pctDelta(newStudents30d, newStudentsPrev30d);
  const conversionRate  = totalNonFreeAttempts > 0
    ? (totalPaidCount / totalNonFreeAttempts) * 100
    : null;

  // Receita por mês (últimos 6)
  const monthBuckets: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthBuckets[key] = 0;
  }
  for (const p of paymentsLast6Mo) {
    if (!p.paidAt) continue;
    const d = new Date(p.paidAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in monthBuckets) monthBuckets[key] += toNum(p.amount);
  }
  const monthlyData = Object.entries(monthBuckets).map(([key, value]) => {
    const [year, month] = key.split("-").map(Number);
    return { label: fmtMonth.format(new Date(year, month - 1, 1)), value };
  });
  const maxMonthly = Math.max(...monthlyData.map((m) => m.value), 1);

  // Top cursos com receita calculada
  const topCoursesData = topCourses.map((c) => ({
    title: c.title,
    enrollments: c._count.enrollments,
    revenue: c.enrollments.reduce(
      (sum, e) => sum + e.payments.reduce((s, p) => s + toNum(p.amount), 0),
      0
    ),
  }));

  const totalPaidForMethod = paymentsByMethod.reduce((s, m) => s + m._count._all, 0) || 1;
  const currentMonthLabel  = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(now);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex items-baseline justify-between mb-8 flex-wrap gap-2">
        <div>
          <h1 className="font-serif text-3xl font-light text-foreground">Visão Geral</h1>
          <p className="font-sans text-sm text-muted mt-1 capitalize">{currentMonthLabel}</p>
        </div>
        <p className="font-sans text-xs text-muted">
          Receita total acumulada:{" "}
          <span className="font-semibold text-foreground">{fmtBRL.format(revTotalVal)}</span>
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-2xl px-5 py-5">
          <p className="font-sans text-xs text-muted uppercase tracking-wider mb-2">Receita do mês</p>
          <p className="font-serif text-2xl font-medium text-foreground">{fmtBRL.format(revThisMonthVal)}</p>
          <div className="mt-1.5"><Delta value={deltaRev} /></div>
        </div>

        <div className="bg-surface border border-border rounded-2xl px-5 py-5">
          <p className="font-sans text-xs text-muted uppercase tracking-wider mb-2">Matrículas ativas</p>
          <p className="font-serif text-2xl font-medium text-foreground">{activeEnrollments}</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl px-5 py-5">
          <p className="font-sans text-xs text-muted uppercase tracking-wider mb-2">Novos alunos (30d)</p>
          <p className="font-serif text-2xl font-medium text-foreground">{newStudents30d}</p>
          <div className="mt-1.5"><Delta value={deltaStudents} /></div>
        </div>

        <div className="bg-surface border border-border rounded-2xl px-5 py-5">
          <p className="font-sans text-xs text-muted uppercase tracking-wider mb-2">Taxa de conversão</p>
          <p className="font-serif text-2xl font-medium text-foreground">
            {conversionRate !== null ? `${conversionRate.toFixed(0)}%` : "—"}
          </p>
          <p className="font-sans text-xs text-muted mt-1">pago / tentativas</p>
        </div>
      </div>

      {/* Gráfico de barras + Métodos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Receita por mês */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6">
          <p className="font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-6">
            Receita por mês — últimos 6 meses
          </p>
          <div className="flex items-end gap-2 h-28">
            {monthlyData.map(({ label, value }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                {value > 0 && (
                  <span className="font-sans text-[8px] text-muted/70 leading-none">
                    {fmtBRL.format(value).replace("R$ ", "")}
                  </span>
                )}
                <div
                  className="w-full bg-primary/60 hover:bg-primary/80 rounded-t transition-colors min-h-0"
                  style={{ height: value > 0 ? `${Math.max((value / maxMonthly) * 100, 6)}%` : "2px", opacity: value > 0 ? 1 : 0.2 }}
                  title={fmtBRL.format(value)}
                />
                <span className="font-sans text-[9px] text-muted capitalize">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Por método de pagamento */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <p className="font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-5">
            Por método
          </p>
          {paymentsByMethod.length === 0 ? (
            <p className="font-sans text-sm text-muted">Nenhum pagamento ainda.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {paymentsByMethod
                .sort((a, b) => b._count._all - a._count._all)
                .map((m) => {
                  const pct = (m._count._all / totalPaidForMethod) * 100;
                  const ml  = methodLabel[m.method] ?? methodLabel.FREE;
                  return (
                    <div key={m.method}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`font-sans text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ml.color}`}>
                          {ml.label}
                        </span>
                        <span className="font-sans text-xs text-muted">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-primary/50 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Cursos mais vendidos + Últimos pagamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top cursos */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="font-sans text-xs font-semibold text-muted uppercase tracking-wider">
              Cursos mais vendidos
            </p>
          </div>
          {topCoursesData.length === 0 ? (
            <p className="font-sans text-sm text-muted px-5 py-4">Nenhum curso publicado.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {topCoursesData.map((c, i) => (
                  <tr key={i} className="hover:bg-background/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-sans text-sm font-medium text-foreground line-clamp-1">{c.title}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <span className="font-sans text-xs text-muted">{c.enrollments} mat.</span>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <span className="font-sans text-sm font-semibold text-foreground">{fmtBRL.format(c.revenue)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Últimos pagamentos */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="font-sans text-xs font-semibold text-muted uppercase tracking-wider">
              Últimos pagamentos
            </p>
          </div>
          {recentPayments.length === 0 ? (
            <p className="font-sans text-sm text-muted px-5 py-4">Nenhum pagamento ainda.</p>
          ) : (
            <div className="divide-y divide-border">
              {recentPayments.map((p, i) => {
                const ml = methodLabel[p.method] ?? methodLabel.FREE;
                return (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-background/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm font-medium text-foreground truncate">
                        {p.enrollment.user.name ?? p.enrollment.user.email}
                      </p>
                      <p className="font-sans text-xs text-muted truncate">{p.enrollment.course.title}</p>
                    </div>
                    <span className={`font-sans text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${ml.color}`}>
                      {ml.label}
                    </span>
                    <div className="text-right shrink-0">
                      <p className="font-sans text-sm font-semibold text-foreground">{fmtBRL.format(toNum(p.amount))}</p>
                      <p className="font-sans text-[10px] text-muted">
                        {p.paidAt ? fmtDate.format(new Date(p.paidAt)) : "—"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
