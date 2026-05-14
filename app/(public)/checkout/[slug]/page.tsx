import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import CheckoutClient from "./CheckoutClient";

const coursePrices: Record<string, { name: string; price: number; hours: number }> = {
  "manometria-phmetria-impedancia": { name: "Manometria, pHmetria e Impedância", price: 6500, hours: 16 },
  "manometria-anorretal": { name: "Manometria Anorretal", price: 4500, hours: 12 },
  "testes-respiratorios": { name: "Aperfeiçoamento Teórico em Teste Respiratório Hidrogênio e Metano – Novos Protocolos", price: 450, hours: 3 },
  "fisioterapia-respiratoria": { name: "Fisioterapia Respiratória", price: 3500, hours: 12 },
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = coursePrices[slug];
  if (!course) return {};
  return { title: `Inscrição — ${course.name} | Nuvem Ensino` };
}

export default async function CheckoutPage({ params }: Props) {
  const { slug } = await params;
  const course = coursePrices[slug];
  if (!course) notFound();

  const session = await auth();
  if (!session) redirect(`/entrar?callbackUrl=/checkout/${slug}`);

  const hasPayment = !!(process.env.STRIPE_SECRET_KEY && process.env.MP_ACCESS_TOKEN);

  return (
    <CheckoutClient
      slug={slug}
      courseName={course.name}
      price={course.price}
      hours={course.hours}
      userEmail={session.user?.email ?? ""}
      userName={session.user?.name ?? ""}
      hasPayment={hasPayment}
    />
  );
}
