import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { RelatorioFilters } from "./RelatorioFilters";
import { getTranslations } from "next-intl/server";

const methodColor: Record<string, string> = {
  STRIPE:              "text-blue-600 bg-blue-500/10 border-blue-500/20",
  MERCADO_PAGO_PIX:    "text-green-600 bg-green-500/10 border-green-500/20",
  MERCADO_PAGO_BOLETO: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  MERCADO_PAGO_CARD:   "text-purple-600 bg-purple-500/10 border-purple-500/20",
  FREE:                "text-muted bg-border/50 border-border",
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

  // Converte datas dos filtros
  const fromDate = from ? new Date(from + "T00:00:00") : undefined;
  const toDate   = to   ? new Date(to   + "T23:59:59") : undefined;

  // Busca em paralelo: lista de cursos (para o select) + pagamentos filtrados
  const [courses, payments] = await Promise.all([
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),

    prisma.payment.findMany({
      where: {
        status: "PAID",
        ...(fromDate || toDate
          ? { paidAt: { ...(fromDate && { gte: fromDate }), ...(toDate && { lte: toDate }) } }
          : {}),
        ...(courseId ? { enrollment: { courseId } } : {}),
      },
      select: {
        id:       true,
        amount:   true,
        method:   true,
        paidAt:   true,
        enrollment: {
          select: {
            userId:   true,
            courseId: true,
            user:   { select: { name: true, email: true } },
            course: { select: { title: true, price: true } },
          },
        },
      },
      orderBy: { paidAt: "desc" },
      take: 1000,
    }),
  ]);

  // Busca cupons usados para os pares userId+courseId dos pagamentos
  const pairs = payments.map((p) => ({
    userId:   p.enrollment.userId,
    courseId: p.enrollment.courseId,
  }));

  const couponUsages =
    pairs.length > 0
      ? await prisma.couponUsage.findMany({
          where: {
            OR: pairs,
          },
          select: {
            userId:   true,
            courseId: true,
            coupon: { select: { code: true, discountPct: true, discountFlat: true } },
          },
        })
      : [];

  // Cria mapa userId+courseId → coupon
  const couponMap = new Map<string, (typeof couponUsages)[0]["coupon"]>();
  for (const u of couponUsages) {
    couponMap.set(`${u.userId}:${u.courseId}`, u.coupon);
  }

  // Totais
  const totalReceita  = payments.reduce((s, p) => s + toNum(p.amount), 0);
  const totalPagamentos = payments.length;
  const mediaValor    = totalPagamentos > 0 ? totalReceita / totalPagamentos : 0;

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

      {/* KPI resumo do período filtrado */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-2xl px-5 py-4">
          <p className="font-sans text-xs text-muted uppercase tracking-wider mb-1">{t("periodTotal")}</p>
          <p className="font-serif text-2xl font-medium text-foreground">{fmtBRL.format(totalReceita)}</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl px-5 py-4">
          <p className="font-sans text-xs text-muted uppercase tracking-wider mb-1">{t("payments")}</p>
          <p className="font-serif text-2xl font-medium text-foreground">{totalPagamentos}</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl px-5 py-4">
          <p className="font-sans text-xs text-muted uppercase tracking-wider mb-1">{t("avgValue")}</p>
          <p className="font-serif text-2xl font-medium text-foreground">{fmtBRL.format(mediaValor)}</p>
        </div>
      </div>

      {/* Tabela */}
      {payments.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl px-5 py-12 text-center">
          <p className="font-sans text-sm text-muted">{t("none")}</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {payments.length === 1000 && (
            <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20">
              <p className="font-sans text-xs text-amber-600">{t("limit1000")}</p>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">{t("colDate")}</th>
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">{t("colStudent")}</th>
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell">{t("colCourse")}</th>
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden sm:table-cell">{t("colMethod")}</th>
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden lg:table-cell">{t("colCoupon")}</th>
                  <th className="px-5 py-3 text-right font-sans text-xs font-semibold text-muted uppercase tracking-wider">{t("colValue")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => {
                  const coupon = couponMap.get(`${p.enrollment.userId}:${p.enrollment.courseId}`);
                  const mc = methodColor[p.method] ?? methodColor.FREE;
                  const ml = p.method;

                  return (
                    <tr key={p.id} className="hover:bg-background/50 transition-colors">
                      {/* Data */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-sans text-xs text-muted">
                          {p.paidAt ? fmtDate.format(new Date(p.paidAt)) : "—"}
                        </span>
                      </td>

                      {/* Aluno */}
                      <td className="px-5 py-3.5">
                        <p className="font-sans text-sm font-medium text-foreground leading-tight">
                          {p.enrollment.user.name ?? "—"}
                        </p>
                        <p className="font-sans text-xs text-muted">{p.enrollment.user.email}</p>
                      </td>

                      {/* Curso */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="font-sans text-sm text-foreground line-clamp-1">
                          {p.enrollment.course.title}
                        </span>
                      </td>

                      {/* Método */}
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className={`font-sans text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${mc}`}>
                          {ml}
                        </span>
                      </td>

                      {/* Cupom */}
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        {coupon ? (
                          <div>
                            <span className="font-sans text-xs font-semibold text-foreground">
                              {coupon.code}
                            </span>
                            <span className="font-sans text-[10px] text-muted ml-1">
                              {coupon.discountPct
                                ? `-${coupon.discountPct}%`
                                : coupon.discountFlat
                                ? `-${fmtBRL.format(toNum(coupon.discountFlat))}`
                                : ""}
                            </span>
                          </div>
                        ) : (
                          <span className="font-sans text-xs text-muted/40">—</span>
                        )}
                      </td>

                      {/* Valor */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <span className="font-sans text-sm font-semibold text-foreground">
                          {fmtBRL.format(toNum(p.amount))}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Rodapé com total */}
              <tfoot>
                <tr className="border-t-2 border-border bg-background">
                  <td colSpan={5} className="px-5 py-3 font-sans text-sm font-semibold text-muted">
                    {totalPagamentos === 1 ? t("totalOne", { count: 1 }) : t("totalPlural", { count: totalPagamentos })}
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
