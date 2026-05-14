import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

export async function POST(req: Request) {
  const body = await req.json();

  if (body.type !== "payment") return NextResponse.json({ ok: true });

  const paymentId = body.data?.id;
  if (!paymentId) return NextResponse.json({ ok: true });

  const payment = new Payment(mp);
  const mpPayment = await payment.get({ id: paymentId });

  const enrollmentId = mpPayment.metadata?.enrollment_id as string | undefined;
  if (!enrollmentId) return NextResponse.json({ ok: true });

  const status = mpPayment.status;

  if (status === "approved") {
    await prisma.payment.updateMany({
      where: { enrollmentId, status: "PENDING" },
      data: {
        status: "PAID",
        paidAt: new Date(),
        mpPaymentId: String(paymentId),
      },
    });

    const enrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "ACTIVE" },
    });

    await prisma.certificate.upsert({
      where: { enrollmentId },
      create: { userId: enrollment.userId, enrollmentId },
      update: {},
    });
  } else if (status === "rejected" || status === "cancelled") {
    await prisma.payment.updateMany({
      where: { enrollmentId, status: "PENDING" },
      data: { status: "FAILED" },
    });
  }

  return NextResponse.json({ ok: true });
}
