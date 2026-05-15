import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
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
    // Release reserved seat
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { courseId: true },
    });
    if (enrollment) {
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { status: "CANCELLED" },
      });
      await prisma.course.update({
        where: { id: enrollment.courseId },
        data: { reservedSeats: { decrement: 1 } },
      });
    }
  } else if (status === "refunded") {
    await prisma.payment.updateMany({
      where: { enrollmentId },
      data: { status: "REFUNDED" },
    });
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { courseId: true },
    });
    if (enrollment) {
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { status: "REFUNDED" },
      });
      await prisma.course.update({
        where: { id: enrollment.courseId },
        data: { reservedSeats: { decrement: 1 } },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
