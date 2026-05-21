import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Asaas sends a token in the header "asaas-access-token" if configured
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
    payment?: {
      id: string;
      status: string;
      externalReference?: string; // enrollment ID
      value: number;
    };
  };

  // Only care about confirmed payments
  if (
    (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") &&
    payment?.id
  ) {
    const dbPayment = await prisma.payment.findFirst({
      where: { asaasPaymentId: payment.id },
      select: { id: true, enrollmentId: true, status: true },
    });

    if (dbPayment && dbPayment.status !== "PAID") {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: dbPayment.id },
          data: { status: "PAID", paidAt: new Date() },
        }),
        prisma.enrollment.update({
          where: { id: dbPayment.enrollmentId },
          data: { status: "ACTIVE" },
        }),
      ]);
    }
  }

  if (event === "PAYMENT_REFUNDED" && payment?.id) {
    const dbPayment = await prisma.payment.findFirst({
      where: { asaasPaymentId: payment.id },
      select: { id: true, enrollmentId: true },
    });
    if (dbPayment) {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: dbPayment.id },
          data: { status: "REFUNDED" },
        }),
        prisma.enrollment.update({
          where: { id: dbPayment.enrollmentId },
          data: { status: "REFUNDED" },
        }),
      ]);
    }
  }

  return NextResponse.json({ received: true });
}
