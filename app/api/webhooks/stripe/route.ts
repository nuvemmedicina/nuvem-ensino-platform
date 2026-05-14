import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
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
    }
  }

  return NextResponse.json({ ok: true });
}
