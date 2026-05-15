import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Webhook signature inválida." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = (event as any).data.object as { metadata?: Record<string, string>; payment_intent?: string; url?: string };
    const enrollmentId = session.metadata?.enrollmentId;
    if (!enrollmentId) return NextResponse.json({ ok: true });

    await prisma.payment.updateMany({
      where: { enrollmentId, status: "PENDING" },
      data: {
        status: "PAID",
        paidAt: new Date(),
        stripeIntentId: session.payment_intent as string,
        receiptUrl: session.url ?? undefined,
      },
    });

    const enrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "ACTIVE" },
    });

    // Issue certificate if course completed
    await prisma.certificate.upsert({
      where: { enrollmentId },
      create: { userId: enrollment.userId, enrollmentId },
      update: {},
    });
  }

  if (event.type === "checkout.session.expired") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = (event as any).data.object as { metadata?: Record<string, string> };
    const enrollmentId = session.metadata?.enrollmentId;
    if (enrollmentId) {
      await prisma.payment.updateMany({
        where: { enrollmentId, status: "PENDING" },
        data: { status: "FAILED" },
      });
      // Release reserved seat
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        select: { courseId: true, status: true },
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
    }
  }

  if (event.type === "charge.refunded") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const charge = (event as any).data.object as { payment_intent?: string };
    if (charge.payment_intent) {
      const payment = await prisma.payment.findFirst({
        where: { stripeIntentId: charge.payment_intent as string },
        select: { enrollmentId: true },
      });
      if (payment) {
        await prisma.payment.updateMany({
          where: { stripeIntentId: charge.payment_intent as string },
          data: { status: "REFUNDED" },
        });
        const enrollment = await prisma.enrollment.findUnique({
          where: { id: payment.enrollmentId },
          select: { courseId: true },
        });
        if (enrollment) {
          await prisma.enrollment.update({
            where: { id: payment.enrollmentId },
            data: { status: "REFUNDED" },
          });
          await prisma.course.update({
            where: { id: enrollment.courseId },
            data: { reservedSeats: { decrement: 1 } },
          });
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
