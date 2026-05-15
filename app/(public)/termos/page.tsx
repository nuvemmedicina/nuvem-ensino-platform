import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Leia os termos de uso da plataforma NU.V.E.M Ensino: condições de uso, matrículas, pagamentos e propriedade intelectual.",
  alternates: { canonical: "/termos" },
  robots: { index: false, follow: false },
};

const sections = [
  {
    title: "1. Aceitação dos Termos",
    text: "Ao acessar e utilizar a plataforma NU.V.E.M Ensino, você concorda com estes Termos de Uso. Caso não concorde com alguma disposição, recomendamos que não utilize os serviços. A NU.V.E.M Ensino reserva-se o direito de atualizar estes termos a qualquer momento, com aviso prévio aos usuários cadastrados.",
  },
  {
    title: "2. Descrição dos Serviços",
    text: "A NU.V.E.M Ensino é uma plataforma de ensino médico online e presencial, operada por NUVEM ENSINO (CNPJ 42.679.051/0001-31), que oferece cursos nas áreas de gastroenterologia, motilidade digestiva e fisioterapia pélvica, ministrados por profissionais habilitados.",
  },
  {
    title: "3. Cadastro e Conta",
    text: "Para adquirir cursos, é necessário criar uma conta com dados verídicos. Você é responsável pela confidencialidade de sua senha e por todas as atividades realizadas em sua conta. Em caso de uso não autorizado, notifique imediatamente cursos@nuvemensino.com.br.",
  },
  {
    title: "4. Aquisição de Cursos",
    text: "Os cursos são adquiridos mediante pagamento conforme os valores indicados na plataforma. O acesso é liberado após a confirmação do pagamento. Para cursos presenciais (hands-on), a data e horário serão confirmados por nossa equipe após a inscrição.",
  },
  {
    title: "5. Política de Reembolso",
    text: "Nos termos do Código de Defesa do Consumidor (Lei nº 8.078/1990), você tem direito ao arrependimento em até 7 dias corridos após a compra, desde que menos de 20% do conteúdo online tenha sido acessado. Para cursos presenciais, o cancelamento deve ser feito com no mínimo 72 horas de antecedência para reembolso integral.",
  },
  {
    title: "6. Propriedade Intelectual",
    text: "Todo o conteúdo da plataforma (videoaulas, materiais didáticos, textos, imagens e marcas) é de propriedade exclusiva da NU.V.E.M Ensino ou de seus instrutores. É vedada a reprodução, distribuição ou comercialização de qualquer conteúdo sem autorização expressa e por escrito.",
  },
  {
    title: "7. Uso Permitido",
    text: "O acesso à plataforma é pessoal e intransferível. É proibido compartilhar credenciais de acesso, gravar ou redistribuir aulas, utilizar o conteúdo para fins comerciais, ou praticar qualquer ato que prejudique a plataforma ou outros usuários.",
  },
  {
    title: "8. Conteúdo Educacional",
    text: "O conteúdo disponibilizado tem finalidade exclusivamente educacional para profissionais de saúde. Não constitui prescrição médica, diagnóstico ou substituição de consulta profissional, em conformidade com as normas do Conselho Federal de Medicina (Res. CFM nº 1.974/2011).",
  },
  {
    title: "9. Limitação de Responsabilidade",
    text: "A NU.V.E.M Ensino não se responsabiliza por danos decorrentes de interrupções técnicas, erros de sistema ou uso indevido da plataforma pelo usuário. Nosso compromisso é garantir a disponibilidade do serviço com razoável nível de continuidade.",
  },
  {
    title: "10. Foro e Legislação",
    text: "Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da Comarca de Belo Horizonte, MG para dirimir quaisquer controvérsias decorrentes deste instrumento.",
  },
  {
    title: "11. Contato",
    text: "Para dúvidas ou solicitações relacionadas a estes Termos, entre em contato: cursos@nuvemensino.com.br | (31) 2537-3131 | Belo Horizonte, MG.",
  },
];

export default function TermosPage() {
  return (
    <div className="min-h-screen">
      <section className="bg-canvas px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-4xl font-light text-white mb-3">Termos de Uso</h1>
          <p className="font-sans text-sm text-white/50">
            Última atualização: maio de 2026 · NUVEM ENSINO · CNPJ 42.679.051/0001-31
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {sections.map(({ title, text }) => (
            <div key={title}>
              <h2 className="font-sans text-sm font-bold text-foreground mb-2">{title}</h2>
              <p className="font-sans text-sm text-muted leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-8 border-t border-border flex flex-col sm:flex-row gap-3">
          <Link
            href="/privacidade"
            className="font-sans text-sm text-primary hover:underline"
          >
            → Política de Privacidade
          </Link>
          <Link
            href="/faq"
            className="font-sans text-sm text-primary hover:underline"
          >
            → Dúvidas Frequentes
          </Link>
        </div>
      </section>
    </div>
  );
}
