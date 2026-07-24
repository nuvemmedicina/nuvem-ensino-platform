import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { localizedCourse } from "@/lib/i18n-content";
import {
  isLiveDiciPromoActive,
  liveDiciPromoDeadlineLabel,
  LIVE_DICI_SLUG,
  LIVE_DICI_COUPON_CODE,
  LIVE_DICI_DISCOUNT_PCT,
} from "@/lib/live-dici-promo";
import CheckoutClient from "./CheckoutClient";

type Props = { params: Promise<{ slug: string; locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const course = await prisma.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      title: true,
      titleEn: true, titleEs: true,
      shortDesc: true, shortDescEn: true, shortDescEs: true,
      description: true, descriptionEn: true, descriptionEs: true,
    },
  });
  if (!course) return {};
  const lc = localizedCourse(course, locale);
  return { title: `Inscrição — ${lc.title} | Nuvem Ensino` };
}

export default async function CheckoutPage({ params }: Props) {
  const { slug, locale } = await params;

  const course = await prisma.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      title: true, price: true, hours: true,
      titleEn: true, titleEs: true,
      shortDesc: true, shortDescEn: true, shortDescEs: true,
      description: true, descriptionEn: true, descriptionEs: true,
      externalCheckoutUrl: true,
    },
  });
  if (!course) notFound();

  // Curso com checkout externo → redireciona imediatamente
  if (course.externalCheckoutUrl) redirect(course.externalCheckoutUrl);

  const session = await auth();
  // Checkout como convidado (sem login) só é permitido para o curso da live —
  // os demais cursos continuam exigindo login antes de comprar, como sempre.
  const allowGuestCheckout = slug === LIVE_DICI_SLUG;
  if (!session && !allowGuestCheckout) redirect(`/entrar?callbackUrl=/checkout/${slug}`);

  const lc = localizedCourse(course, locale);
  const mpTokenDb = await prisma.platformSetting.findUnique({ where: { key: "mp_access_token" } });
  const hasPayment = !!(process.env.STRIPE_SECRET_KEY || process.env.ASAAS_API_KEY || process.env.MP_ACCESS_TOKEN || mpTokenDb?.value);

  // Pré-carregar WhatsApp salvo do usuário (só quando há sessão)
  const dbUser = session
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { phone: true } })
    : null;

  return (
    <CheckoutClient
      slug={slug}
      courseName={lc.title}
      price={Number(course.price)}
      hours={course.hours}
      userEmail={session?.user?.email ?? ""}
      userName={session?.user?.name ?? ""}
      userPhone={dbUser?.phone ?? ""}
      hasPayment={hasPayment}
      isGuest={!session}
      promoNotice={
        isLiveDiciPromoActive(slug)
          ? `1º Lote: use o cupom ${LIVE_DICI_COUPON_CODE} para ${LIVE_DICI_DISCOUNT_PCT}% OFF — válido até ${liveDiciPromoDeadlineLabel()} (72h após a Live)`
          : undefined
      }
    />
  );
}
