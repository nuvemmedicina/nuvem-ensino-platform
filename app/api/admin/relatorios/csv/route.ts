import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function toNum(v: unknown): number {
  return v === null || v === undefined ? 0 : Number(v);
}

function escapeCsv(val: string | null | undefined): string {
  if (!val) return "";
  const s = String(val);
  // Envolve em aspas se tiver vírgula, aspas ou quebra de linha
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: Request) {
  // Verifica autenticação e role ADMIN
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user?.id || role !== "ADMIN") {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from     = searchParams.get("from");
  const to       = searchParams.get("to");
  const courseId = searchParams.get("courseId");

  const fromDate = from ? new Date(from + "T00:00:00") : undefined;
  const toDate   = to   ? new Date(to   + "T23:59:59") : undefined;

  const payments = await prisma.payment.findMany({
    where: {
      status: "PAID",
      ...(fromDate || toDate
        ? { paidAt: { ...(fromDate && { gte: fromDate }), ...(toDate && { lte: toDate }) } }
        : {}),
      ...(courseId ? { enrollment: { courseId } } : {}),
    },
    select: {
      amount:   true,
      method:   true,
      paidAt:   true,
      enrollment: {
        select: {
          userId:   true,
          courseId: true,
          user:   { select: { name: true, email: true } },
          course: { select: { title: true } },
        },
      },
    },
    orderBy: { paidAt: "desc" },
    take: 10000,
  });

  // Busca cupons usados
  const pairs = payments.map((p) => ({
    userId:   p.enrollment.userId,
    courseId: p.enrollment.courseId,
  }));

  const couponUsages =
    pairs.length > 0
      ? await prisma.couponUsage.findMany({
          where: { OR: pairs },
          select: {
            userId:   true,
            courseId: true,
            coupon: { select: { code: true, discountPct: true, discountFlat: true } },
          },
        })
      : [];

  const couponMap = new Map<string, (typeof couponUsages)[0]["coupon"]>();
  for (const u of couponUsages) {
    couponMap.set(`${u.userId}:${u.courseId}`, u.coupon);
  }

  const methodLabel: Record<string, string> = {
    STRIPE:              "Stripe",
    MERCADO_PAGO_PIX:    "PIX",
    MERCADO_PAGO_BOLETO: "Boleto",
    MERCADO_PAGO_CARD:   "Cartão",
    FREE:                "Grátis",
  };

  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);

  // Monta CSV
  const header = ["Data", "Nome", "E-mail", "Curso", "Método", "Cupom", "Desconto", "Valor (BRL)"].join(",");

  const rows = payments.map((p) => {
    const coupon = couponMap.get(`${p.enrollment.userId}:${p.enrollment.courseId}`);
    const discount = coupon
      ? coupon.discountPct
        ? `${coupon.discountPct}%`
        : coupon.discountFlat
        ? toNum(coupon.discountFlat).toFixed(2)
        : ""
      : "";

    return [
      escapeCsv(p.paidAt ? fmtDate(new Date(p.paidAt)) : ""),
      escapeCsv(p.enrollment.user.name),
      escapeCsv(p.enrollment.user.email),
      escapeCsv(p.enrollment.course.title),
      escapeCsv(methodLabel[p.method] ?? p.method),
      escapeCsv(coupon?.code),
      escapeCsv(discount),
      toNum(p.amount).toFixed(2).replace(".", ","),
    ].join(",");
  });

  // Total
  const total = payments.reduce((s, p) => s + toNum(p.amount), 0);
  rows.push(["", "", "", "", "", "", "TOTAL", total.toFixed(2).replace(".", ",")].join(","));

  const csv = "﻿" + [header, ...rows].join("\r\n"); // BOM para Excel reconhecer UTF-8

  const filename = `faturamento-nuvem-ensino-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control":       "no-store",
    },
  });
}
