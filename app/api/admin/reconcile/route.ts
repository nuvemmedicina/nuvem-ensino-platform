import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendEnrollmentConfirmation } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.nuvemensino.com.br";
const ASAAS_BASE = process.env.ASAAS_SANDBOX === "true"
  ? "https://sandbox.asaas.com/api/v3"
  : "https://api.asaas.com/v3";

async function asaasGet<T>(path: string): Promise<T> {
  const res = await fetch(`${ASAAS_BASE}${path}`, {
    headers: { "access_token": process.env.ASAAS_API_KEY! },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Asaas ${res.status}: ${await res.text()}`);
  return res.json();
}

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return !session?.user?.id || role !== "ADMIN";
}

export async function POST(req: NextRequest) {
  if (await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { dryRun = false } = await req.json().catch(() => ({}));

  // Busca todos os pagamentos CONFIRMED/RECEIVED no Asaas (últimos 90 dias)
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  let offset = 0;
  const asaasConfirmed: Array<{ id: string; status: string; value: number }> = [];

  while (true) {
    const page = await asaasGet<{ data: Array<{ id: string; status: string; value: number }>; hasMore: boolean }>(
      `/payments?status=CONFIRMED&dateCreated[ge]=${since}&limit=100&offset=${offset}`
    );
    asaasConfirmed.push(...page.data);
    if (!page.hasMore) break;
    offset += 100;
  }

  const fixes: Array<{ type: string; paymentId: string; enrollmentId: string; email: string; course: string }> = [];
  const errors: string[] = [];

  for (const ap of asaasConfirmed) {
    try {
      const dbPayment = await prisma.payment.findFirst({
        where: { asaasPaymentId: ap.id },
        select: { id: true, enrollmentId: true, status: true, couponId: true },
      });
      if (!dbPayment) continue;
      if (dbPayment.status === "PAID") continue; // já correto

      const enrollment = await prisma.enrollment.findUnique({
        where: { id: dbPayment.enrollmentId },
        include: {
          user: { select: { email: true, name: true } },
          course: { select: { title: true, slug: true } },
        },
      });
      if (!enrollment) continue;
      if (enrollment.status === "ACTIVE") continue; // já correto

      fixes.push({
        type: "activate",
        paymentId: ap.id,
        enrollmentId: enrollment.id,
        email: enrollment.user.email,
        course: enrollment.course.title,
      });

      if (!dryRun) {
        await prisma.$transaction([
          prisma.payment.update({ where: { id: dbPayment.id }, data: { status: "PAID", paidAt: new Date() } }),
          prisma.enrollment.update({ where: { id: enrollment.id }, data: { status: "ACTIVE" } }),
        ]);
        if (dbPayment.couponId) {
          await prisma.coupon.update({ where: { id: dbPayment.couponId }, data: { usesCount: { increment: 1 } } }).catch(() => {});
        }
        await prisma.certificate.upsert({
          where: { enrollmentId: enrollment.id },
          create: { userId: enrollment.userId, enrollmentId: enrollment.id },
          update: {},
        }).catch(() => {});
        sendEnrollmentConfirmation({
          to: enrollment.user.email,
          userName: enrollment.user.name ?? "Aluno",
          courseName: enrollment.course.title,
          courseSlug: enrollment.course.slug,
        }).catch(() => {});
      }
    } catch (err) {
      errors.push(String(err));
    }
  }

  return NextResponse.json({ dryRun, fixed: fixes.length, fixes, errors });
}

export async function GET(req: NextRequest) {
  if (await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // Retorna resumo: pagamentos no banco vs status da matrícula
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      enrollment: {
        include: {
          user: { select: { email: true, name: true } },
          course: { select: { title: true } },
        },
      },
    },
  });

  const rows = payments.map((p) => ({
    paymentId: p.id,
    asaasId: p.asaasPaymentId,
    paymentStatus: p.status,
    enrollmentStatus: p.enrollment.status,
    amount: p.amount,
    method: p.method,
    paidAt: p.paidAt,
    createdAt: p.createdAt,
    user: p.enrollment.user.email,
    userName: p.enrollment.user.name,
    course: p.enrollment.course.title,
    divergent: p.status === "PAID" && p.enrollment.status !== "ACTIVE" && p.enrollment.status !== "COMPLETED",
  }));

  return NextResponse.json({ total: rows.length, divergent: rows.filter((r) => r.divergent).length, rows });
}
