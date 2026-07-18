import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEnrollmentConfirmation, sendPaymentPendingEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.nuvemensino.com.br";

export async function POST(req: NextRequest) {
  const secret = process.env.ASAAS_WEBHOOK_TOKEN;
  if (secret) {
    const token = req.headers.get("asaas-access-token");
    if (token !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = await req.json();
  const { event, payment } = body as {
    event: string;
    payment?: { id: string; status: string; externalReference?: string; value: number; billingType?: string };
  };

  // ── Pagamento confirmado ────────────────────────────────────────────────────
  if ((event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") && payment?.id) {
    const dbPayment = await prisma.payment.findFirst({
      where: { asaasPaymentId: payment.id },
      select: { id: true, enrollmentId: true, status: true, couponId: true },
    });

    if (dbPayment && dbPayment.status !== "PAID") {
      const enrollment = await prisma.enrollment.update({
        where: { id: dbPayment.enrollmentId },
        data: { status: "ACTIVE" },
        include: {
          user: { select: { email: true, name: true } },
          course: { select: { title: true, slug: true } },
        },
      });
      await prisma.payment.update({
        where: { id: dbPayment.id },
        data: { status: "PAID", paidAt: new Date() },
      });
      if (dbPayment.couponId) {
        prisma.$transaction([
          prisma.coupon.update({ where: { id: dbPayment.couponId }, data: { usesCount: { increment: 1 } } }),
          prisma.couponUsage.create({ data: { couponId: dbPayment.couponId, courseId: enrollment.courseId, userId: enrollment.userId } }),
        ]).catch((err) => console.error("Asaas coupon usage error:", err));
      }
      prisma.certificate.upsert({
        where: { enrollmentId: dbPayment.enrollmentId },
        create: { userId: enrollment.userId, enrollmentId: dbPayment.enrollmentId },
        update: {},
      }).catch((err) => console.error("Asaas certificate error:", err));
      sendEnrollmentConfirmation({
        to: enrollment.user.email,
        userName: enrollment.user.name ?? "Aluno",
        courseName: enrollment.course.title,
        courseSlug: enrollment.course.slug,
      }).catch((err) => console.error("Asaas enrollment email error:", err));
    }
  }

  // ── Pagamento vencido ───────────────────────────────────────────────────────
  // PENDING  → CANCELLED (vaga liberada)
  // ACTIVE   → SUSPENDED (parcelamento atrasado, acesso suspenso)
  if (event === "PAYMENT_OVERDUE" && payment?.id) {
    const dbPayment = await prisma.payment.findFirst({
      where: { asaasPaymentId: payment.id },
      select: { id: true, enrollmentId: true },
    });
    if (dbPayment) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: dbPayment.enrollmentId },
        select: { courseId: true, status: true, userId: true },
      });
      if (enrollment?.status === "PENDING") {
        await prisma.$transaction([
          prisma.payment.update({ where: { id: dbPayment.id }, data: { status: "FAILED" } }),
          prisma.enrollment.update({ where: { id: dbPayment.enrollmentId }, data: { status: "CANCELLED" } }),
          prisma.course.update({ where: { id: enrollment.courseId }, data: { reservedSeats: { decrement: 1 } } }),
        ]);
        const [user, course] = await Promise.all([
          prisma.user.findUnique({ where: { id: enrollment.userId }, select: { email: true, name: true } }),
          prisma.course.findUnique({ where: { id: enrollment.courseId }, select: { title: true, slug: true } }),
        ]);
        if (user && course) {
          sendPaymentPendingEmail({
            to: user.email,
            userName: user.name ?? "Aluno",
            courseName: course.title,
            method: payment?.billingType ?? "pix",
            checkoutUrl: `${APP_URL}/checkout/${course.slug}`,
          }).catch((err) => console.error("Asaas pending email error:", err));
        }
      } else if (enrollment?.status === "ACTIVE") {
        // Parcelamento atrasado: suspende acesso sem cancelar definitivamente
        await prisma.$transaction([
          prisma.payment.update({ where: { id: dbPayment.id }, data: { status: "FAILED" } }),
          prisma.enrollment.update({ where: { id: dbPayment.enrollmentId }, data: { status: "SUSPENDED" } }),
        ]);
        const [user, course] = await Promise.all([
          prisma.user.findUnique({ where: { id: enrollment.userId }, select: { email: true, name: true } }),
          prisma.course.findUnique({ where: { id: enrollment.courseId }, select: { title: true, slug: true } }),
        ]);
        if (user && course) {
          sendPaymentPendingEmail({
            to: user.email,
            userName: user.name ?? "Aluno",
            courseName: course.title,
            method: payment?.billingType ?? "pix",
            checkoutUrl: `${APP_URL}/checkout/${course.slug}`,
          }).catch((err) => console.error("Asaas suspended email error:", err));
        }
      }
    }
  }

  // ── Pagamento deletado ou chargeback → cancela/suspende ────────────────────
  if ((event === "PAYMENT_DELETED" || event === "PAYMENT_CHARGEBACK_REQUESTED" || event === "PAYMENT_CHARGEBACK_DISPUTE") && payment?.id) {
    const dbPayment = await prisma.payment.findFirst({
      where: { asaasPaymentId: payment.id },
      select: { id: true, enrollmentId: true },
    });
    if (dbPayment) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: dbPayment.enrollmentId },
        select: { courseId: true, status: true },
      });
      if (enrollment && (enrollment.status === "PENDING" || enrollment.status === "ACTIVE")) {
        const newStatus = enrollment.status === "ACTIVE" ? "SUSPENDED" : "CANCELLED";
        await prisma.$transaction([
          prisma.payment.update({ where: { id: dbPayment.id }, data: { status: "FAILED" } }),
          prisma.enrollment.update({ where: { id: dbPayment.enrollmentId }, data: { status: newStatus } }),
          ...(enrollment.status === "PENDING"
            ? [prisma.course.update({ where: { id: enrollment.courseId }, data: { reservedSeats: { decrement: 1 } } })]
            : []),
        ]);
      }
    }
  }

  // ── Reembolso ───────────────────────────────────────────────────────────────
  if (event === "PAYMENT_REFUNDED" && payment?.id) {
    const dbPayment = await prisma.payment.findFirst({
      where: { asaasPaymentId: payment.id },
      select: { id: true, enrollmentId: true },
    });
    if (dbPayment) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: dbPayment.enrollmentId },
        select: { courseId: true },
      });
      await prisma.$transaction([
        prisma.payment.update({ where: { id: dbPayment.id }, data: { status: "REFUNDED" } }),
        prisma.enrollment.update({ where: { id: dbPayment.enrollmentId }, data: { status: "REFUNDED" } }),
        ...(enrollment
          ? [prisma.course.update({ where: { id: enrollment.courseId }, data: { reservedSeats: { decrement: 1 } } })]
          : []),
      ]);
    }
  }

  return NextResponse.json({ received: true });
}
