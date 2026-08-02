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
