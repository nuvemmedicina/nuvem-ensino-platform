import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { localizedCourse } from "@/lib/i18n-content";
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
  if (!session) redirect(`/entrar?callbackUrl=/checkout/${slug}`);

  const lc = localizedCourse(course, locale);
  const mpTokenDb = await prisma.platformSetting.findUnique({ where: { key: "mp_access_token" } });
  const hasPayment = !!(process.env.STRIPE_SECRET_KEY || process.env.MP_ACCESS_TOKEN || mpTokenDb?.value);

  return (
    <CheckoutClient
      slug={slug}
      courseName={lc.title}
      price={Number(course.price)}
      hours={course.hours}
      userEmail={session.user?.email ?? ""}
      userName={session.user?.name ?? ""}
      hasPayment={hasPayment}
    />
  );
}
