import type { Metadata } from "next";
import FaqClient from "./FaqClient";

export const metadata: Metadata = {
  title: "Perguntas Frequentes (FAQ)",
  description:
    "Tire suas dúvidas sobre matrículas, pagamentos, certificados, acesso ao conteúdo e cursos presenciais da NU.V.E.M Ensino.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ — Perguntas Frequentes | NU.V.E.M Ensino",
    description:
      "Tire suas dúvidas sobre matrículas, pagamentos, certificados e cursos presenciais da NU.V.E.M Ensino.",
    url: "/faq",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Como funciona a matrícula?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Após escolher o curso, clique em 'Matricular-se'. Você será direcionado ao checkout, onde pode pagar via cartão de crédito, boleto ou Pix. Após a confirmação do pagamento, o acesso é liberado imediatamente na sua área do aluno.",
      },
    },
    {
      "@type": "Question",
      name: "Os cursos têm data e hora fixas?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Os cursos online (gravados) ficam disponíveis 24 horas por dia e você assiste no seu próprio ritmo. Os cursos hands-on presenciais têm datas específicas, consulte a página de cada curso para ver as turmas disponíveis.",
      },
    },
    {
      "@type": "Question",
      name: "Por quanto tempo tenho acesso ao conteúdo?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "O acesso aos cursos online é por tempo indeterminado após a matrícula. Para cursos presenciais, o material de apoio digital fica disponível permanentemente na plataforma.",
      },
    },
    {
      "@type": "Question",
      name: "Como recebo o certificado?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "O certificado é emitido digitalmente após a conclusão de todas as aulas e/ou atividades do curso. Ele fica disponível na seção 'Certificados' da sua área do aluno, com código de verificação único.",
      },
    },
    {
      "@type": "Question",
      name: "Posso parcelar o pagamento?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sim, aceitamos parcelamento em até 3x no cartão de crédito. Para pagamento à vista via Pix, pode haver desconto. Verifique na página do curso.",
      },
    },
    {
      "@type": "Question",
      name: "Qual é a política de reembolso?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oferecemos reembolso integral em até 7 dias corridos após a compra, desde que menos de 20% do conteúdo do curso tenha sido acessado, conforme o Código de Defesa do Consumidor.",
      },
    },
    {
      "@type": "Question",
      name: "Como funciona o curso presencial?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Os cursos hands-on são realizados na NU.V.E.M Medicina em Belo Horizonte, MG. As turmas são pequenas (máximo 2 a 14 alunos) para garantir atenção individualizada.",
      },
    },
    {
      "@type": "Question",
      name: "Há desconto para grupos ou instituições?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sim, oferecemos condições especiais para grupos a partir de 3 pessoas ou para instituições de saúde. Entre em contato pelo e-mail cursos@nuvemensino.com.br ou pelo WhatsApp (31) 99726-1029.",
      },
    },
    {
      "@type": "Question",
      name: "Como entro em contato com a equipe?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Você pode nos contatar por e-mail em cursos@nuvemensino.com.br, pelo telefone (31) 2537-3131 ou pelo WhatsApp (31) 99726-1029.",
      },
    },
  ],
};

export default function FaqPage() {
  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section className="bg-canvas px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <span className="font-sans text-xs font-semibold tracking-[0.25em] uppercase text-accent opacity-80 mb-4 block">
            Dúvidas frequentes
          </span>
          <h1 className="font-serif text-4xl font-light text-white mb-3">FAQ</h1>
          <p className="font-sans text-sm text-white/50">
            Não encontrou o que precisa?{" "}
            <a href="mailto:cursos@nuvemensino.com.br" className="text-accent hover:underline">
              Fale com a gente
            </a>
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12">
        <FaqClient />

        <div className="mt-12 p-6 bg-surface border border-border rounded-2xl text-center">
          <p className="font-sans text-sm text-muted mb-4">
            Ainda tem dúvidas? Nossa equipe está pronta para ajudar.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:cursos@nuvemensino.com.br"
              className="font-sans text-sm font-semibold px-6 py-2.5 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              Enviar e-mail
            </a>
            <a
              href="https://wa.me/5531997261029"
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-sm font-semibold px-6 py-2.5 rounded-full border border-border text-foreground hover:border-primary/40 transition-colors"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
