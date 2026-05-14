import { NextResponse } from "next/server";
import Stripe from "stripe";
import { MercadoPagoConfig, Payment as MPPayment, Preference } from "mercadopago";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const courseData: Record<string, { name: string; price: number; hours: number }> = {
  "manometria-phmetria-impedancia": { name: "Manometria, pHmetria e Impedância", price: 6500, hours: 16 },
  "manometria-anorretal": { name: "Manometria Anorretal", price: 4500, hours: 12 },
  "testes-respiratorios": { name: "Aperfeiçoamento Teórico em Teste Respiratório Hidrogênio e Metano – Novos Protocolos", price: 450, hours: 3 },
  "fisioterapia-respiratoria": { name: "Fisioterapia nas Disfunções do Assoalho Pélvico", price: 3500, hours: 30 },
  "desvendando-a-constipacao-intestinal": { name: "Desvendando a Constipação Intestinal, Classificação Roma IV, Tempo de Trânsito Colônico e Manometria Anorretal", price: 380, hours: 3 },
};

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { courseSlug, method, couponCode } = await req.json();

  const course = courseData[courseSlug as string];
  if (!course) {
    return NextResponse.json({ error: "Curso não encontrado." }, { status: 404 });
  }

  // Validate coupon
  let discountPct = 0;
  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: { code: couponCode, active: true },
    });
    if (coupon?.discountPct) discountPct = coupon.discountPct;
  }

  const finalPrice = Math.round(course.price * (1 - discountPct / 100) * 100) / 100;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Find or create course record
  const dbCourse = await prisma.course.findFirst({ where: { slug: courseSlug } });
  if (!dbCourse) {
    return NextResponse.json({ error: "Curso não cadastrado no banco." }, { status: 404 });
  }

  // Ensure no duplicate enrollment
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: dbCourse.id } },
  });
  if (existingEnrollment?.status === "ACTIVE" || existingEnrollment?.status === "COMPLETED") {
    return NextResponse.json({ error: "Você já está matriculado neste curso." }, { status: 409 });
  }

  // Create pending enrollment
  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: session.user.id, courseId: dbCourse.id } },
    create: { userId: session.user.id, courseId: dbCourse.id, status: "ACTIVE" },
    update: { status: "ACTIVE" },
  });

  if (method === "stripe") {
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: session.user.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: course.name,
              description: `${course.hours}h de formação — Nuvem Ensino`,
            },
            unit_amount: Math.round(finalPrice * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { enrollmentId: enrollment.id, userId: session.user.id },
      success_url: `${appUrl}/dashboard/cursos/${courseSlug}?sucesso=1`,
      cancel_url: `${appUrl}/checkout/${courseSlug}?cancelado=1`,
    });

    await prisma.payment.create({
      data: {
        enrollmentId: enrollment.id,
        method: "STRIPE",
        status: "PENDING",
        amount: finalPrice,
        stripeIntentId: checkoutSession.payment_intent as string | undefined,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  }

  if (method === "pix" || method === "boleto" || method === "parcelado") {
    const preference = new Preference(mp);

    const pref = await preference.create({
      body: {
        items: [
          {
            id: dbCourse.id,
            title: course.name,
            unit_price: finalPrice,
            quantity: 1,
            currency_id: "BRL",
          },
        ],
        payer: { email: session.user.email ?? "" },
        back_urls: {
          success: `${appUrl}/dashboard/cursos/${courseSlug}?sucesso=1`,
          failure: `${appUrl}/checkout/${courseSlug}?erro=1`,
          pending: `${appUrl}/checkout/${courseSlug}?pendente=1`,
        },
        auto_return: "approved",
        metadata: { enrollmentId: enrollment.id },
        payment_methods: {
          excluded_payment_methods: method === "pix"
            ? [{ id: "bolbradesco" }, { id: "credit_card" }]
            : method === "boleto"
            ? [{ id: "credit_card" }]
            : [],
          installments: method === "parcelado" ? 12 : 1,
        },
      },
    });

    await prisma.payment.create({
      data: {
        enrollmentId: enrollment.id,
        method:
          method === "pix"
            ? "MERCADO_PAGO_PIX"
            : method === "boleto"
            ? "MERCADO_PAGO_BOLETO"
            : "MERCADO_PAGO_CARD",
        status: "PENDING",
        amount: finalPrice,
        mpOrderId: String(pref.id),
      },
    });

    return NextResponse.json({ url: pref.init_point });
  }

  return NextResponse.json({ error: "Método inválido." }, { status: 400 });
}
