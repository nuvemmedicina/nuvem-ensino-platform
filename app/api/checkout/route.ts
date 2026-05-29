import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  findOrCreateCustomer,
  createPayment,
  getPixQrCode,
} from "@/lib/asaas";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { courseSlug, method, couponCode, installments } = await req.json();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nuvemensino.com.br";

  // Validate coupon
  let discountPct = 0;
  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: { code: couponCode, active: true },
    });
    if (coupon?.discountPct) discountPct = coupon.discountPct;
  }

  // Find course + reserve seat atomically
  // eslint-disable-next-line prefer-const
  let dbCourse!: { id: string; title: string; price: number; hours: number };
  // eslint-disable-next-line prefer-const
  let enrollment!: { id: string };
  let finalPrice!: number;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const c = await tx.course.findFirst({
        where: { slug: courseSlug, status: "PUBLISHED" },
        select: { id: true, title: true, price: true, hours: true, totalSeats: true, reservedSeats: true },
      });
      if (!c) throw Object.assign(new Error("Curso não cadastrado no banco."), { status: 404 });

      if (c.totalSeats !== null) {
        const available = c.totalSeats - c.reservedSeats;
        if (available <= 0)
          throw Object.assign(new Error("Não há vagas disponíveis para este curso."), { status: 409 });
      }

      const existing = await tx.enrollment.findUnique({
        where: { userId_courseId: { userId: session.user.id, courseId: c.id } },
        select: { id: true, status: true },
      });
      if (existing?.status === "ACTIVE" || existing?.status === "COMPLETED")
        throw Object.assign(new Error("Você já está matriculado neste curso."), { status: 409 });

      if (c.totalSeats !== null)
        await tx.course.update({ where: { id: c.id }, data: { reservedSeats: { increment: 1 } } });

      const enr = existing
        ? await tx.enrollment.update({ where: { id: existing.id }, data: { status: "ACTIVE" } })
        : await tx.enrollment.create({
            data: { userId: session.user.id, courseId: c.id, status: "ACTIVE" },
          });

      return { course: c, enrollment: enr };
    });

    dbCourse   = { ...result.course, price: Number(result.course.price) };
    enrollment = result.enrollment;
    finalPrice = Math.round(dbCourse.price * (1 - discountPct / 100) * 100) / 100;
  } catch (err: unknown) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }

  // ── Stripe (international card) ──────────────────────────────────────────
  if (method === "stripe") {
    if (!process.env.STRIPE_SECRET_KEY)
      return NextResponse.json({ error: "Stripe não configurado." }, { status: 503 });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: session.user.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: dbCourse.title,
              description: `${dbCourse.hours}h de formação, NU.V.E.M ENSINO`,
            },
            unit_amount: Math.round(finalPrice * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { enrollmentId: enrollment.id, userId: session.user.id },
      success_url: `${appUrl}/dashboard/cursos/${courseSlug}?sucesso=1`,
      cancel_url:  `${appUrl}/checkout/${courseSlug}?cancelado=1`,
    });

    await prisma.payment.create({
      data: {
        enrollmentId:  enrollment.id,
        method:        "STRIPE",
        status:        "PENDING",
        amount:        finalPrice,
        stripeIntentId: checkoutSession.payment_intent as string | undefined,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  }

  // ── Asaas (PIX / Boleto / Cartão parcelado) ──────────────────────────────
  if (method === "pix" || method === "boleto" || method === "parcelado") {
    if (!process.env.ASAAS_API_KEY)
      return NextResponse.json({ error: "Asaas não configurado. Adicione ASAAS_API_KEY nas variáveis de ambiente." }, { status: 503 });

    const customer = await findOrCreateCustomer(
      session.user.email ?? "",
      session.user.name  ?? session.user.email ?? "Aluno",
    );

    const billingType =
      method === "pix"      ? "PIX"         :
      method === "boleto"   ? "BOLETO"       :
      /* parcelado */         "CREDIT_CARD";

    const payment = await createPayment({
      customerId:        customer.id,
      billingType,
      value:             finalPrice,
      description:       `${dbCourse.title} — NU.V.E.M ENSINO`,
      externalReference: enrollment.id,
      installmentCount:  method === "parcelado" ? Math.min(Math.max(Number(installments) || 3, 1), 3) : 1,
      successUrl:        `${appUrl}/dashboard/cursos/${courseSlug}?sucesso=1`,
    });

    const dbMethod =
      method === "pix"      ? "ASAAS_PIX"   :
      method === "boleto"   ? "ASAAS_BOLETO" :
      /* parcelado */         "ASAAS_CARD";

    await prisma.payment.create({
      data: {
        enrollmentId:  enrollment.id,
        method:        dbMethod,
        status:        "PENDING",
        amount:        finalPrice,
        asaasPaymentId: payment.id,
      },
    });

    // PIX: return QR code to show inline
    if (method === "pix") {
      const qr = await getPixQrCode(payment.id);
      return NextResponse.json({
        pixQrCodeImage:  qr.encodedImage,   // base64 PNG
        pixCopyPaste:    qr.payload,        // copia e cola
        pixExpiration:   qr.expirationDate,
      });
    }

    // Boleto / Parcelado: redirect to Asaas hosted page
    const redirectUrl = method === "boleto"
      ? (payment.bankSlipUrl ?? payment.invoiceUrl)
      : payment.invoiceUrl;

    return NextResponse.json({ url: redirectUrl });
  }

  return NextResponse.json({ error: "Método inválido." }, { status: 400 });
}
