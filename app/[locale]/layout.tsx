import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import Script from "next/script";
import { PostHogProvider } from "@/components/PostHogProvider";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import { routing } from "@/i18n/routing";
import "../globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://nuvemensino.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "NU.V.E.M ENSINO — Formação Médica de Excelência",
    template: "%s | NU.V.E.M ENSINO",
  },
  description:
    "Curso de Aperfeiçoamento em DICI — 96h | 4 módulos + bônus, 100% online. 4h de aula ao vivo por módulo. Coordenação: Dra. Vera Lúcia Ângelo Andrade. Certificação FACOP / MEC.",
  keywords: [
    "curso DICI",
    "neurogastroenterologia",
    "distúrbios da interação cérebro-intestino",
    "curso online médico",
    "gastroenterologia",
    "motilidade digestiva",
    "formação médica online",
    "certificação MEC",
    "FACOP",
    "NU.V.E.M",
    "nuvem ensino",
    "dra vera angelo",
    "aperfeiçoamento médico",
  ],
  authors: [{ name: "NU.V.E.M ENSINO", url: APP_URL }],
  creator: "NU.V.E.M ENSINO",
  publisher: "NU.V.E.M ENSINO",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: APP_URL,
    siteName: "NU.V.E.M ENSINO",
    title: "NU.V.E.M ENSINO — Formação Médica de Excelência",
    description:
      "Cursos hands-on e online de Gastroenterologia, Motilidade Digestiva e Fisioterapia Pélvica. Certificação ISO 9001.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "NU.V.E.M ENSINO — Formação Médica de Excelência",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NU.V.E.M ENSINO — Formação Médica de Excelência",
    description:
      "Cursos hands-on e online de Gastroenterologia, Motilidade Digestiva e Fisioterapia Pélvica. Certificação ISO 9001.",
    images: ["/opengraph-image"],
    creator: "@NuvemEnsino",
  },
  alternates: {
    canonical: APP_URL,
  },
  category: "education",
  verification: {
    google: "4uvseus2L5dSqz1irnL5_X0AE9souRF6j0d9gzFyWL8",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${cormorant.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* Google Analytics */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
        <NextIntlClientProvider messages={messages}>
          <PostHogProvider>{children}</PostHogProvider>
          <ServiceWorkerRegistrar />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
