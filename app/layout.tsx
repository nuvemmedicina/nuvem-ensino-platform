import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/PostHogProvider";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.nuvemensino.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "NU.V.E.M Ensino — Formação Médica de Excelência",
    template: "%s | NU.V.E.M Ensino",
  },
  description:
    "Cursos hands-on e online de Gastroenterologia, Motilidade Digestiva e Fisioterapia Pélvica. Formação prática supervisionada por especialistas em Belo Horizonte, MG. Certificação ISO 9001.",
  keywords: [
    "cursos médicos",
    "gastroenterologia",
    "manometria esofágica",
    "testes respiratórios",
    "pHmetria",
    "fisioterapia pélvica",
    "motilidade digestiva",
    "formação médica",
    "cursos hands-on",
    "belo horizonte",
    "NU.V.E.M",
    "nuvem ensino",
    "dra vera angelo",
    "manometria de alta resolução",
  ],
  authors: [{ name: "NU.V.E.M Ensino", url: APP_URL }],
  creator: "NU.V.E.M Ensino",
  publisher: "NU.V.E.M Ensino",
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
    siteName: "NU.V.E.M Ensino",
    title: "NU.V.E.M Ensino — Formação Médica de Excelência",
    description:
      "Cursos hands-on e online de Gastroenterologia, Motilidade Digestiva e Fisioterapia Pélvica. Certificação ISO 9001.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NU.V.E.M Ensino — Formação Médica de Excelência",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NU.V.E.M Ensino — Formação Médica de Excelência",
    description:
      "Cursos hands-on e online de Gastroenterologia, Motilidade Digestiva e Fisioterapia Pélvica. Certificação ISO 9001.",
    images: ["/og-image.png"],
    creator: "@NuvemEnsino",
  },
  alternates: {
    canonical: APP_URL,
  },
  category: "education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${cormorant.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
