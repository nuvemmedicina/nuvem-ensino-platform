import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatPhone, toWhatsApp } from "@/lib/phone";

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
  if (!session?.user?.id || (role !== "ADMIN" && role !== "EDITOR")) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from     = searchParams.get("from");
  const to       = searchParams.get("to");
  const courseId = searchParams.get("courseId");

  const fromDate = from ? new Date(from + "T00:00:00") : undefined;
  const toDate   = to   ? new Date(to   + "T23:59:59") : undefined;

  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: { in: ["ACTIVE", "COMPLETED"] },
      ...(fromDate || toDate
        ? { enrolledAt: { ...(fromDate && { gte: fromDate }), ...(toDate && { lte: toDate }) } }
        : {}),
      ...(courseId ? { courseId } : {}),
    },
    select: {
      enrolledAt: true,
      user:   { select: { name: true, email: true, phone: true } },
      course: { select: { title: true, price: true } },
      payments: {
        select: { method: true, status: true, amount: true, paidAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { enrolledAt: "desc" },
    take: 10000,
  });

  const methodLabel: Record<string, string> = {
    STRIPE:       "Stripe",
    ASAAS_PIX:    "PIX",
    ASAAS_BOLETO: "Boleto",
    ASAAS_CARD:   "Cartão",
    FREE:         "Grátis",
  };

  const payStatusLabel: Record<string, string> = {
    PAID:     "Pago",
    PENDING:  "Aguardando",
    OVERDUE:  "Vencido",
    REFUNDED: "Reembolsado",
  };

  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);

  // Monta CSV
  const colunas = [
    "Data inscrição", "Nome", "E-mail", "Telefone", "WhatsApp",
    "Curso", "Método", "Status pgto", "Valor (BRL)",
  ];
  const header = colunas.join(",");

  const rows = enrollments.map((enr) => {
    const pay = enr.payments[0];
    const amount = pay ? toNum(pay.amount) : toNum(enr.course.price);
    return [
      escapeCsv(fmtDate(new Date(enr.enrolledAt))),
      escapeCsv(enr.user.name),
      escapeCsv(enr.user.email),
      escapeCsv(formatPhone(enr.user.phone)),
      escapeCsv(toWhatsApp(enr.user.phone)),
      escapeCsv(enr.course.title),
      escapeCsv(pay ? (methodLabel[pay.method] ?? pay.method) : "—"),
      escapeCsv(pay ? (payStatusLabel[pay.status] ?? pay.status) : "Aguardando"),
      // Aspas obrigatórias: a vírgula decimal é o mesmo caractere que separa as
      // colunas, e sem isso o valor virava duas células na planilha.
      escapeCsv(amount.toFixed(2).replace(".", ",")),
    ].join(",");
  });

  // Total apenas pagamentos confirmados. O rótulo vai na penúltima coluna e o
  // valor na última, alinhado com o cabeçalho — antes sobrava uma coluna e a
  // linha de total saía deslocada na planilha.
  const total = enrollments
    .filter((e) => e.payments[0]?.status === "PAID")
    .reduce((s, e) => s + toNum(e.payments[0]?.amount), 0);
  rows.push([
    ...Array(colunas.length - 2).fill(""),
    "TOTAL",
    escapeCsv(total.toFixed(2).replace(".", ",")),
  ].join(","));

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
