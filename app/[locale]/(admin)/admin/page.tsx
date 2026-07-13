import { prisma } from "@/lib/prisma";
import { TrendingUp, TrendingDown, Minus, DollarSign, Users, BookOpen, Zap, Radio, Calendar, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";

const methodBadge: Record<string, { label: string; color: string }> = {
  STRIPE:              { label: "Stripe",  color: "text-blue-600 bg-blue-50 border-blue-200" },
  ASAAS_PIX:           { label: "PIX",     color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  ASAAS_BOLETO:        { label: "Boleto",  color: "text-amber-600 bg-amber-50 border-amber-200" },
  ASAAS_CARD:          { label: "Cartão",  color: "text-violet-600 bg-violet-50 border-violet-200" },
  MERCADO_PAGO_PIX:    { label: "PIX",     color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  MERCADO_PAGO_BOLETO: { label: "Boleto",  color: "text-amber-600 bg-amber-50 border-amber-200" },
  MERCADO_PAGO_CARD:   { label: "Cartão",  color: "text-violet-600 bg-violet-50 border-violet-200" },
  FREE:                { label: "Grátis",  color: "text-slate-500 bg-slate-50 border-slate-200" },
};

function Delta({ value }: { value: number | null }) {
  if (value === null) return null;
  if (value === 0)
    return <span className="inline-flex items-center gap-0.5 text-xs text-slate-400"><Minus className="w-3 h-3" /> 0%</span>;
  const positive = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${positive ? "text-emerald-600" : "text-red-500"}`}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positive ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function toNum(val: unknown): number {
  if (val === null || val === undefined) return 0;
  return Number(val);
}

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.overview" });

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
    recentEnrollments,
    upcomingLives,
    liveLeadCounts,
  ] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID", paidAt: { gte: startThisMonth } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID", paidAt: { gte: startLastMonth, lte: endLastMonth } } }),
    prisma.enrollment.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "STUDENT", createdAt: { gte: start30DaysAgo } } }),
    prisma.user.count({ where: { role: "STUDENT", createdAt: { gte: start60DaysAgo, lt: start30DaysAgo } } }),
    prisma.payment.count({ where: { status: "PAID" } }),
    prisma.payment.count({ where: { method: { not: "FREE" } } }),
    prisma.payment.groupBy({ by: ["method"], _count: { _all: true }, where: { status: "PAID" }, orderBy: { _count: { method: "desc" } } }),
    prisma.payment.findMany({ where: { status: "PAID", paidAt: { gte: start6MonthsAgo } }, select: { amount: true, paidAt: true } }),
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      select: {
        title: true,
        slug: true,
        _count: { select: { enrollments: { where: { status: { in: ["ACTIVE", "COMPLETED"] } } } } },
        enrollments: {
          where: { status: { in: ["ACTIVE", "COMPLETED"] } },
          select: { payments: { select: { amount: true, status: true }, take: 1, orderBy: { createdAt: "desc" } } },
        },
      },
      orderBy: { enrollments: { _count: "desc" } },
      take: 5,
    }),
    prisma.enrollment.findMany({
      where: { status: { in: ["ACTIVE", "COMPLETED"] } },
      select: {
        enrolledAt: true,
        user:   { select: { name: true, email: true } },
        course: { select: { title: true } },
        payments: { select: { amount: true, method: true, status: true, paidAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { enrolledAt: "desc" },
      take: 8,
    }),
    prisma.liveSession.findMany({
      where: { startAt: { gte: now } },
      select: {
        id: true,
        title: true,
        startAt: true,
        location: true,
        course: {
          select: {
            title: true,
            _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
          },
        },
      },
      orderBy: { startAt: "asc" },
      take: 5,
    }),
    prisma.liveLead.groupBy({ by: ["eventSlug"], _count: { _all: true } }),
  ]);

  const dateLocale      = locale === "en" ? "en-US" : locale === "es" ? "es-ES" : "pt-BR";
  const fmtBRL          = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const fmtDate         = new Intl.DateTimeFormat(dateLocale, { day: "2-digit", month: "2-digit", year: "numeric" });
  const fmtMonth        = new Intl.DateTimeFormat(dateLocale, { month: "short" });
  const fmtLiveDate     = new Intl.DateTimeFormat(dateLocale, { weekday: "short", day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" });
  const fmtLiveTime     = new Intl.DateTimeFormat(dateLocale, { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

  const revThisMonthVal = toNum(revThisMonth._sum.amount);
  const revLastMonthVal = toNum(revLastMonth._sum.amount);
  const revTotalVal     = toNum(revTotal._sum.amount);
  const deltaRev        = pctDelta(revThisMonthVal, revLastMonthVal);
  const deltaStudents   = pctDelta(newStudents30d, newStudentsPrev30d);
  const conversionRate  = totalNonFreeAttempts > 0 ? (totalPaidCount / totalNonFreeAttempts) * 100 : null;

  const liveLeadMap: Record<string, number> = {};
  for (const g of liveLeadCounts) liveLeadMap[g.eventSlug] = g._count._all;
  const totalLiveLeads = liveLeadCounts.reduce((s, g) => s + g._count._all, 0);

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

  const topCoursesData = topCourses.map((c) => ({
    title: c.title,
    slug: c.slug,
    enrollments: c._count.enrollments,
    revenue: c.enrollments.reduce(
      (sum, e) => sum + e.payments.reduce((s, p) => s + (p.status === "PAID" ? toNum(p.amount) : 0), 0),
      0
    ),
  }));
  const maxRevCourse = Math.max(...topCoursesData.map((c) => c.revenue), 1);

  const totalPaidForMethod = paymentsByMethod.reduce((s, m) => s + m._count._all, 0) || 1;
  const currentMonthLabel  = new Intl.DateTimeFormat(dateLocale, { month: "long", year: "numeric" }).format(now);

  const methodColors: Record<string, string> = {
    ASAAS_CARD: "bg-violet-500", MERCADO_PAGO_CARD: "bg-violet-500",
    ASAAS_PIX: "bg-emerald-500", MERCADO_PAGO_PIX: "bg-emerald-500",
    ASAAS_BOLETO: "bg-amber-500", MERCADO_PAGO_BOLETO: "bg-amber-500",
    STRIPE: "bg-blue-500", FREE: "bg-slate-400",
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-light text-foreground">{t("title")}</h1>
          <p className="font-sans text-sm text-muted mt-0.5 capitalize">{currentMonthLabel}</p>
        </div>
        <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-4 py-2.5">
          <DollarSign className="w-3.5 h-3.5 text-muted" />
          <span className="font-sans text-xs text-muted">{t("totalRevenueLabel")}</span>
          <span className="font-sans text-sm font-bold text-foreground">{fmtBRL.format(revTotalVal)}</span>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-semibold text-muted uppercase tracking-wider">{t("monthRevenue")}</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div>
            <p className="font-serif text-2xl font-medium text-foreground">{fmtBRL.format(revThisMonthVal)}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <Delta value={deltaRev} />
              {deltaRev !== null && <span className="font-sans text-[10px] text-muted">vs mês anterior</span>}
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-semibold text-muted uppercase tracking-wider">{t("activeEnrollments")}</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <div>
            <p className="font-serif text-2xl font-medium text-foreground">{activeEnrollments}</p>
            <p className="font-sans text-[10px] text-muted mt-1">matrículas ativas</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-semibold text-muted uppercase tracking-wider">{t("newStudents30d")}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div>
            <p className="font-serif text-2xl font-medium text-foreground">{newStudents30d}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <Delta value={deltaStudents} />
              {deltaStudents !== null && <span className="font-sans text-[10px] text-muted">vs 30d anteriores</span>}
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-semibold text-muted uppercase tracking-wider">{t("conversionRate")}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div>
            <p className="font-serif text-2xl font-medium text-foreground">
              {conversionRate !== null ? `${conversionRate.toFixed(0)}%` : "—"}
            </p>
            <p className="font-sans text-[10px] text-muted mt-1">{t("conversionDesc")}</p>
          </div>
        </div>
      </div>

      {/* ── Gráfico receita + Métodos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Gráfico de barras */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <p className="font-sans text-xs font-bold text-foreground uppercase tracking-wider">{t("revenueChart")}</p>
            <span className="font-sans text-[10px] text-muted bg-background border border-border px-2.5 py-1 rounded-full">Últimos 6 meses</span>
          </div>
          <div className="flex items-end gap-3 h-36">
            {monthlyData.map(({ label, value }, idx) => {
              const isCurrentMonth = idx === monthlyData.length - 1;
              const heightPct = value > 0 ? Math.max((value / maxMonthly) * 100, 6) : 2;
              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-default">
                  {value > 0 && (
                    <span className="font-sans text-[9px] text-muted leading-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {fmtBRL.format(value).replace("R$ ", "")}
                    </span>
                  )}
                  <div
                    className={`w-full rounded-lg transition-all ${
                      isCurrentMonth
                        ? "bg-primary shadow-md shadow-primary/20"
                        : "bg-primary/25 group-hover:bg-primary/40"
                    }`}
                    style={{ height: `${heightPct}%` }}
                    title={fmtBRL.format(value)}
                  />
                  <span className="font-sans text-[9px] text-muted capitalize">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Por método */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <p className="font-sans text-xs font-bold text-foreground uppercase tracking-wider mb-5">{t("byMethod")}</p>
          {paymentsByMethod.length === 0 ? (
            <p className="font-sans text-sm text-muted">{t("noPayments")}</p>
          ) : (
            <div className="flex flex-col gap-4">
              {paymentsByMethod
                .sort((a, b) => b._count._all - a._count._all)
                .map((m) => {
                  const pct = (m._count._all / totalPaidForMethod) * 100;
                  const ml  = methodBadge[m.method] ?? methodBadge.FREE;
                  const barColor = methodColors[m.method] ?? "bg-slate-400";
                  return (
                    <div key={m.method}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-sans text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${ml.color}`}>
                          {ml.label}
                        </span>
                        <span className="font-sans text-xs font-semibold text-foreground">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* ── Próximas Lives ── */}
      {upcomingLives.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Radio className="w-3.5 h-3.5 text-red-500" />
              </div>
              <p className="font-sans text-xs font-bold text-foreground uppercase tracking-wider">Próximas Aulas ao Vivo</p>
            </div>
            <a href="/admin/live-leads" className="font-sans text-xs font-semibold text-primary hover:underline">
              {totalLiveLeads} inscrições no formulário →
            </a>
          </div>
          <div className="divide-y divide-border">
            {upcomingLives.map((live) => (
              <div key={live.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-background/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm font-semibold text-foreground truncate">{live.title}</p>
                  <p className="font-sans text-xs text-muted truncate">{live.course.title}</p>
                </div>
                <div className="flex items-center gap-1.5 font-sans text-xs text-muted shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                  <span className="capitalize">{fmtLiveDate.format(new Date(live.startAt))}</span>
                  <span className="text-border">·</span>
                  <span>{fmtLiveTime.format(new Date(live.startAt))}</span>
                </div>
                {live.location && (
                  <div className="hidden sm:flex items-center gap-1 font-sans text-xs text-muted shrink-0">
                    <MapPin className="w-3 h-3 text-muted/60" />
                    {live.location}
                  </div>
                )}
                <div className="shrink-0 text-right">
                  <span className="font-sans text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    {live.course._count.enrollments} matriculados
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Top Cursos + Últimas Matrículas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Top cursos */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="font-sans text-xs font-bold text-foreground uppercase tracking-wider">{t("topCourses")}</p>
          </div>
          {topCoursesData.length === 0 ? (
            <p className="font-sans text-sm text-muted px-5 py-4">{t("noCourses")}</p>
          ) : (
            <div className="divide-y divide-border">
              {topCoursesData.map((c, i) => (
                <div key={i} className="px-5 py-3.5 hover:bg-background/50 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="font-sans text-sm font-medium text-foreground line-clamp-1 flex-1">{c.title}</p>
                    <div className="text-right shrink-0">
                      <p className="font-sans text-sm font-bold text-foreground">{fmtBRL.format(c.revenue)}</p>
                      <p className="font-sans text-[10px] text-muted">{c.enrollments} mat.</p>
                    </div>
                  </div>
                  <div className="h-1 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/50 rounded-full"
                      style={{ width: `${(c.revenue / maxRevCourse) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimas matrículas */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <p className="font-sans text-xs font-bold text-foreground uppercase tracking-wider">Últimas Matrículas</p>
          </div>
          {recentEnrollments.length === 0 ? (
            <p className="font-sans text-sm text-muted px-5 py-4">{t("noPayments")}</p>
          ) : (
            <div className="divide-y divide-border">
              {recentEnrollments.map((enr, i) => {
                const pay      = enr.payments[0];
                const method   = pay?.method ?? "FREE";
                const isPaid   = pay?.status === "PAID";
                const ml       = methodBadge[method] ?? methodBadge.FREE;
                return (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-background/50 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="font-sans text-[10px] font-bold text-primary">
                        {(enr.user.name ?? enr.user.email ?? "?")[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm font-semibold text-foreground truncate">
                        {enr.user.name ?? enr.user.email}
                      </p>
                      <p className="font-sans text-[11px] text-muted truncate">{enr.course.title}</p>
                    </div>
                    <span className={`font-sans text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${ml.color}`}>
                      {ml.label}
                    </span>
                    <div className="text-right shrink-0">
                      <p className="font-sans text-sm font-bold text-foreground">
                        {fmtBRL.format(pay ? toNum(pay.amount) : 0)}
                      </p>
                      <p className={`font-sans text-[10px] ${isPaid ? "text-emerald-600" : "text-amber-500"}`}>
                        {isPaid ? (pay?.paidAt ? fmtDate.format(new Date(pay.paidAt)) : "Pago") : "Aguardando"}
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
