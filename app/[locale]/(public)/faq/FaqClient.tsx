"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Como funciona a matrícula?",
    a: "Após escolher o curso, clique em 'Matricular-se'. Você será direcionado ao checkout, onde pode pagar via cartão de crédito, boleto ou Pix. Após a confirmação do pagamento, o acesso é liberado imediatamente na sua área do aluno.",
  },
  {
    q: "Os cursos têm data e hora fixas?",
    a: "Os cursos online (gravados) ficam disponíveis 24 horas por dia e você assiste no seu próprio ritmo. Os cursos hands-on presenciais têm datas específicas, consulte a página de cada curso para ver as turmas disponíveis.",
  },
  {
    q: "Por quanto tempo tenho acesso ao conteúdo?",
    a: "O acesso aos cursos online é por tempo indeterminado após a matrícula. Para cursos presenciais, o material de apoio digital fica disponível permanentemente na plataforma.",
  },
  {
    q: "Como recebo o certificado?",
    a: "O certificado é emitido digitalmente após a conclusão de todas as aulas e/ou atividades do curso. Ele fica disponível na seção 'Certificados' da sua área do aluno, com código de verificação único.",
  },
  {
    q: "Posso parcelar o pagamento?",
    a: "Sim, aceitamos parcelamento em até 3x no cartão de crédito. Para pagamento à vista via Pix, pode haver desconto. Verifique na página do curso.",
  },
  {
    q: "Qual é a política de reembolso?",
    a: "Oferecemos reembolso integral em até 7 dias corridos após a compra, desde que menos de 20% do conteúdo do curso tenha sido acessado, conforme o Código de Defesa do Consumidor. Para cursos presenciais, consulte as condições específicas na página do curso.",
  },
  {
    q: "Os cursos têm suporte após o término?",
    a: "Sim. Após o curso, você pode tirar dúvidas por e-mail com o instrutor por até 30 dias. Cursos hands-on incluem suporte pós-curso conforme descrito na página de cada treinamento.",
  },
  {
    q: "Como funciona o curso presencial?",
    a: "Os cursos hands-on são realizados na NU.V.E.M Medicina em Belo Horizonte, MG. As turmas são pequenas (máximo 2 a 14 alunos dependendo do curso) para garantir atenção individualizada. Após a compra, nossa equipe entrará em contato para confirmar a data.",
  },
  {
    q: "Há desconto para grupos ou instituições?",
    a: "Sim, oferecemos condições especiais para grupos a partir de 3 pessoas ou para instituições de saúde. Entre em contato pelo e-mail cursos@nuvemensino.com.br ou pelo WhatsApp (31) 99726-1029.",
  },
  {
    q: "Como entro em contato com a equipe?",
    a: "Você pode nos contatar por e-mail em cursos@nuvemensino.com.br, pelo telefone (31) 2537-3131 ou pelo WhatsApp (31) 99726-1029.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left bg-surface hover:bg-background transition-colors"
        aria-expanded={open}
      >
        <span className="font-sans text-sm font-semibold text-foreground pr-4">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-6 py-4 bg-background border-t border-border">
          <p className="font-sans text-sm text-muted leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqClient() {
  return (
    <div className="flex flex-col gap-3">
      {faqs.map((item) => (
        <FaqItem key={item.q} q={item.q} a={item.a} />
      ))}
    </div>
  );
}
