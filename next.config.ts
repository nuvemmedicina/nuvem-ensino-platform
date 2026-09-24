import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // O pdfjs (usado pelo pdf-parse) carrega o próprio worker por import
  // dinâmico. Empacotado pelo Next, esse import aponta para um caminho que não
  // existe na função da Vercel — "Setting up fake worker failed: Cannot find
  // module '/var/task/.next/server/chunks/pdf.worker.mjs'". Mantendo os dois
  // fora do bundle, o require acontece a partir de node_modules, como o
  // pacote espera.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],

  // Tirar do bundle não basta: o rastreamento de arquivos não enxerga o worker,
  // porque ele só é referenciado em tempo de execução. Sem isso ele não é
  // enviado para a função e o erro se repete, agora por arquivo ausente.
  outputFileTracingIncludes: {
    "/api/admin/flashcards/generate": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
    "/api/admin/rag/index": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
  },

  // O curso de fisioterapia pélvica nasceu com o slug "fisioterapia-respiratoria".
  // Os links antigos já divulgados continuam funcionando.
  async redirects() {
    const antigo = "fisioterapia-respiratoria";
    const novo = "fisioterapia-pelvica";
    return [
      { source: `/cursos/${antigo}`, destination: `/cursos/${novo}`, permanent: true },
      { source: `/en/courses/${antigo}`, destination: `/en/courses/${novo}`, permanent: true },
      { source: `/es/cursos/${antigo}`, destination: `/es/cursos/${novo}`, permanent: true },
      { source: `/checkout/${antigo}`, destination: `/checkout/${novo}`, permanent: true },
      { source: `/:locale(en|es)/checkout/${antigo}`, destination: `/:locale/checkout/${novo}`, permanent: true },
      { source: `/dashboard/cursos/${antigo}/:path*`, destination: `/dashboard/cursos/${novo}/:path*`, permanent: true },
      { source: `/:locale(en|es)/dashboard/cursos/${antigo}/:path*`, destination: `/:locale/dashboard/cursos/${novo}/:path*`, permanent: true },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "nuvemensino.com.br",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
