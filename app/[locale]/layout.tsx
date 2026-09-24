import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import Script from "next/script";
import { PostHogProvider } from "@/components/PostHogProvider";
import ConsentBanner from "@/components/ConsentBanner";
import GtmPageView from "@/components/GtmPageView";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import { routing } from "@/i18n/routing";
import "../globals.css";

import { APP_URL } from "@/lib/appUrl";
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

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
      "Curso de Aperfeiçoamento em DICI — 96h | 4 módulos + bônus, 100% online. 4h de aula ao vivo por módulo. Coordenação: Dra. Vera Lúcia Ângelo Andrade. Certificação FACOP / MEC.",
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
      "Curso de Aperfeiçoamento em DICI — 96h | 4 módulos + bônus, 100% online. 4h de aula ao vivo por módulo. Coordenação: Dra. Vera Lúcia Ângelo Andrade. Certificação FACOP / MEC.",
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nuvem Ensino",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#00475E",
    "msapplication-TileImage": "/icone-nuvem.png",
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
        {/* Consent Mode v2: estado padrão negado, antes de qualquer tag
            carregar. O GA4 e o Meta Pixel moram dentro do contêiner do GTM
            (configuração feita no próprio painel do Tag Manager, não neste
            código), e tanto o GTM quanto o gtag entendem esses comandos de
            consent porque os dois leem o mesmo dataLayer.
            Cada carregamento de página começa com um dataLayer novo, então
            o padrão sozinho apagaria a escolha de quem já tinha aceitado
            antes (o clique só atualiza o carregamento em que aconteceu).
            Por isso lemos aqui o mesmo localStorage que lib/consent.ts usa,
            antes de declarar o padrão, para quem retorna já começar com o
            valor certo, sem depender de um evento de update mais tarde.
            Duas categorias, cada uma com sua própria chave: analytics_storage
            segue a escolha de "análise" (GA4/PostHog), e os três sinais de
            anúncio (ad_storage/ad_user_data/ad_personalization) seguem a
            escolha de "publicidade" (Meta Pixel), porque são propósitos
            diferentes e o banner trata como categorias separadas. */}
        {GTM_ID && (
          <Script id="consent-default" strategy="beforeInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              var storedAnalytics = null;
              var storedMarketing = null;
              try {
                storedAnalytics = window.localStorage.getItem('nuvem_consent_analytics');
                storedMarketing = window.localStorage.getItem('nuvem_consent_marketing');
              } catch (e) {}
              var adConsent = storedMarketing === 'granted' ? 'granted' : 'denied';
              gtag('consent', 'default', {
                ad_storage: adConsent,
                analytics_storage: storedAnalytics === 'granted' ? 'granted' : 'denied',
                ad_user_data: adConsent,
                ad_personalization: adConsent,
                wait_for_update: 500
              });
            `}
          </Script>
        )}
        {GTM_ID && (
          <Script id="gtm-loader" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');`}
          </Script>
        )}
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        )}
        <NextIntlClientProvider messages={messages}>
          {GTM_ID && <GtmPageView />}
          <PostHogProvider>{children}</PostHogProvider>
          <ConsentBanner />
          <ServiceWorkerRegistrar />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
