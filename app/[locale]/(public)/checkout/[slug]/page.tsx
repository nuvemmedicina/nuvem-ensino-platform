import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { localizedCourse } from "@/lib/i18n-content";
import { LIVE_DICI_SLUG } from "@/lib/live-dici-promo";
import { configModalidade } from "@/lib/modalidades";
import { presenciaisOcupadas } from "@/lib/modalidadesVagas";
import CheckoutClient from "./CheckoutClient";

type Props = {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ cupom?: string }>;
};

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
  const robots = { index: false, follow: false };
  if (!course) return { robots };
  const lc = localizedCourse(course, locale);
  return { title: `Inscrição — ${lc.title} | NUVEM Ensino`, robots };
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { slug, locale } = await params;
  const { cupom } = await searchParams;

  const course = await prisma.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true, title: true, price: true, hours: true,
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
  if (!session && !allowGuestCheckout) {
    // O cupom do link (ex.: oferta da página do curso) precisa sobreviver ao login e ao cadastro.
    const destino = `/checkout/${slug}${typeof cupom === "string" && cupom ? `?cupom=${encodeURIComponent(cupom)}` : ""}`;
    redirect(`/entrar?callbackUrl=${encodeURIComponent(destino)}`);
  }

  const lc = localizedCourse(course, locale);
  const mpTokenDb = await prisma.platformSetting.findUnique({ where: { key: "mp_access_token" } });
  const hasPayment = !!(process.env.STRIPE_SECRET_KEY || process.env.ASAAS_API_KEY || process.env.MP_ACCESS_TOKEN || mpTokenDb?.value);

  // Pré-carregar WhatsApp e endereço salvos do usuário (só quando há sessão)
  const dbUser = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { phone: true, postalCode: true, address: true, addressNumber: true, addressComplement: true, province: true },
      })
    : null;

  // Presencial ou online: quantas vagas presenciais ainda há (a matrícula da própria pessoa não conta).
  const cfgModalidade = configModalidade(slug);
  const modalidade = cfgModalidade
    ? {
        local: cfgModalidade.local,
        vagasPresenciais: cfgModalidade.vagasPresenciais,
        presenciaisRestantes: Math.max(
          0,
          cfgModalidade.vagasPresenciais -
            (await presenciaisOcupadas(prisma, course.id, session ? { userId: session.user.id } : undefined)),
        ),
      }
    : null;

  return (
    <CheckoutClient
      modalidade={modalidade}
      slug={slug}
      courseName={lc.title}
      price={Number(course.price)}
      hours={course.hours}
      userEmail={session?.user?.email ?? ""}
      userName={session?.user?.name ?? ""}
      userPhone={dbUser?.phone ?? ""}
      userAddress={{
        cep: dbUser?.postalCode ?? "",
        rua: dbUser?.address ?? "",
        numero: dbUser?.addressNumber ?? "",
        complemento: dbUser?.addressComplement ?? "",
        bairro: dbUser?.province ?? "",
      }}
      hasPayment={hasPayment}
      isGuest={!session}
      initialCoupon={typeof cupom === "string" ? cupom.trim().toUpperCase().slice(0, 40) : ""}
    />
  );
}
