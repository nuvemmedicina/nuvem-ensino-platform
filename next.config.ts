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
    // As assinaturas ficam fora de public/ (não acessíveis por URL direta),
    // então o rastreamento de arquivos do build precisa ser avisado
    // explicitamente para incluí-las na função desta rota.
    "/api/certificates/[id]/pdf": ["./private/assinaturas/**/*"],
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

  // Slug do curso corrigido de "fisioterapia-respiratoria" para
  // "fisioterapia-pelvica" (o slug antigo era resquício de um curso
  // anterior de fisioterapia respiratória, o conteúdo real sempre foi de
  // disfunções do assoalho pélvico). Redirect permanente para não perder
  // a indexação já conquistada pela URL antiga nas 3 línguas.
  async redirects() {
    return [
      {
        source: "/cursos/fisioterapia-respiratoria",
        destination: "/cursos/fisioterapia-pelvica",
        permanent: true,
      },
      {
        source: "/en/courses/fisioterapia-respiratoria",
        destination: "/en/courses/fisioterapia-pelvica",
        permanent: true,
      },
      {
        source: "/es/cursos/fisioterapia-respiratoria",
        destination: "/es/cursos/fisioterapia-pelvica",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
