import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { RelatorioFilters } from "./RelatorioFilters";
import { getTranslations } from "next-intl/server";

const methodLabel: Record<string, string> = {
  STRIPE:       "Stripe",
  ASAAS_PIX:    "PIX",
  ASAAS_BOLETO: "Boleto",
  ASAAS_CARD:   "Cartão",
  FREE:         "Gratuito",
};

const methodColor: Record<string, string> = {
  STRIPE:       "text-blue-600 bg-blue-500/10 border-blue-500/20",
  ASAAS_PIX:    "text-green-600 bg-green-500/10 border-green-500/20",
  ASAAS_BOLETO: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  ASAAS_CARD:   "text-purple-600 bg-purple-500/10 border-purple-500/20",
  FREE:         "text-muted bg-border/50 border-border",
};

const payStatusLabel: Record<string, string> = {
  PAID:    "Pago",
  PENDING: "Aguardando",
  OVERDUE: "Vencido",
  REFUNDED:"Reembolsado",
};

const payStatusColor: Record<string, string> = {
  PAID:     "text-green-600 bg-green-500/10 border-green-500/20",
  PENDING:  "text-amber-600 bg-amber-500/10 border-amber-500/20",
  OVERDUE:  "text-red-600 bg-red-500/10 border-red-500/20",
  REFUNDED: "text-muted bg-border/50 border-border",
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string; to?: string; courseId?: string }>;
};

function toNum(v: unknown): number {
  return v === null || v === undefined ? 0 : Number(v);
}

export default async function RelatoriosPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.reports" });
  const dateLocale = locale === "en" ? "en-US" : locale === "es" ? "es-ES" : "pt-BR";
  const fmtBRL  = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const fmtDate = new Intl.DateTimeFormat(dateLocale, { day: "2-digit", month: "2-digit", year: "numeric" });

  const { from, to, courseId } = await searchParams;

  const fromDate = from ? new Date(from + "T00:00:00") : undefined;
  const toDate   = to   ? new Date(to   + "T23:59:59") : undefined;

  const [courses, enrollments] = await Promise.all([
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),

    prisma.enrollment.findMany({
      where: {
        status: { in: ["ACTIVE", "COMPLETED"] },
        ...(fromDate || toDate
          ? { enrolledAt: { ...(fromDate && { gte: fromDate }), ...(toDate && { lte: toDate }) } }
          : {}),
        ...(courseId ? { courseId } : {}),
      },
      select: {
        id:         true,
        enrolledAt: true,
        status:     true,
        user:   { select: { name: true, email: true } },
        course: { select: { title: true, price: true } },
        payments: {
          select: { id: true, method: true, status: true, amount: true, paidAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { enrolledAt: "desc" },
      take: 1000,
    }),
  ]);

  // Totais — conta receita dos pagamentos PAID + valor do curso quando PENDING (compromisso)
  const totalReceita = enrollments.reduce((s, e) => {
    const pay = e.payments[0];
    return s + (pay ? toNum(pay.amount) : toNum(e.course.price));
  }, 0);
  const totalPago = enrollments
    .filter((e) => e.payments[0]?.status === "PAID")
    .reduce((s, e) => s + toNum(e.payments[0]?.amount), 0);
  const totalInscritos = enrollments.length;

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-light text-foreground">{t("title")}</h1>
        <p className="font-sans text-sm text-muted mt-1">{t("subtitle")}</p>
      </div>

      {/* Filtros */}
      <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
        <Suspense fallback={null}>
          <RelatorioFilters courses={courses} />
        </Suspense>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-2xl px-5 py-4">
          <p className="font-sans text-xs text-muted uppercase tracking-wider mb-1">Inscritos</p>
          <p className="font-serif text-2xl font-medium text-foreground">{totalInscritos}</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl px-5 py-4">
          <p className="font-sans text-xs text-muted uppercase tracking-wider mb-1">Receita confirmada</p>
          <p className="font-serif text-2xl font-medium text-foreground">{fmtBRL.format(totalPago)}</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl px-5 py-4">
          <p className="font-sans text-xs text-muted uppercase tracking-wider mb-1">Receita total (com pendentes)</p>
          <p className="font-serif text-2xl font-medium text-foreground">{fmtBRL.format(totalReceita)}</p>
        </div>
      </div>

      {/* Tabela */}
      {enrollments.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl px-5 py-12 text-center">
          <p className="font-sans text-sm text-muted">{t("none")}</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {enrollments.length === 1000 && (
            <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20">
              <p className="font-sans text-xs text-amber-600">{t("limit1000")}</p>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">Data</th>
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">{t("colStudent")}</th>
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell">{t("colCourse")}</th>
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden sm:table-cell">{t("colMethod")}</th>
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">Status pgto</th>
                  <th className="px-5 py-3 text-right font-sans text-xs font-semibold text-muted uppercase tracking-wider">{t("colValue")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {enrollments.map((enr) => {
                  const pay = enr.payments[0];
                  const method = pay?.method ?? "FREE";
                  const payStatus = pay?.status ?? "PENDING";
                  const mc = methodColor[method] ?? methodColor.FREE;
                  const pc = payStatusColor[payStatus] ?? payStatusColor.PENDING;
                  const amount = pay ? toNum(pay.amount) : toNum(enr.course.price);

                  return (
                    <tr key={enr.id} className="hover:bg-background/50 transition-colors">
                      {/* Data de inscrição */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-sans text-xs text-muted">
                          {fmtDate.format(new Date(enr.enrolledAt))}
                        </span>
                      </td>

                      {/* Aluno */}
                      <td className="px-5 py-3.5">
                        <p className="font-sans text-sm font-medium text-foreground leading-tight">
                          {enr.user.name ?? "—"}
                        </p>
                        <p className="font-sans text-xs text-muted">{enr.user.email}</p>
                      </td>

                      {/* Curso */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="font-sans text-sm text-foreground line-clamp-1">
                          {enr.course.title}
                        </span>
                      </td>

                      {/* Método */}
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className={`font-sans text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${mc}`}>
                          {methodLabel[method] ?? method}
                        </span>
                      </td>

                      {/* Status pagamento */}
                      <td className="px-5 py-3.5">
                        <span className={`font-sans text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${pc}`}>
                          {payStatusLabel[payStatus] ?? payStatus}
                        </span>
                      </td>

                      {/* Valor */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <span className="font-sans text-sm font-semibold text-foreground">
                          {fmtBRL.format(amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr className="border-t-2 border-border bg-background">
                  <td colSpan={5} className="px-5 py-3 font-sans text-sm font-semibold text-muted">
                    {totalInscritos === 1 ? t("totalOne", { count: 1 }) : t("totalPlural", { count: totalInscritos })}
                  </td>
                  <td className="px-5 py-3 text-right font-sans text-sm font-bold text-foreground">
                    {fmtBRL.format(totalPago)}
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
