import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Saiba como a NU.V.E.M Ensino coleta, usa e protege seus dados pessoais em conformidade com a LGPD.",
  alternates: { canonical: "/privacidade" },
  robots: { index: false, follow: false },
};

const sections = [
  {
    title: "1. Dados coletados",
    text: "Coletamos nome, e-mail, telefone e dados de pagamento fornecidos voluntariamente no momento do cadastro ou compra. Também podemos coletar dados de navegação (cookies e logs de acesso) para fins de melhoria da plataforma.",
  },
  {
    title: "2. Finalidade do tratamento",
    text: "Os dados são utilizados exclusivamente para: (a) criação e gestão da conta do usuário; (b) processamento de pagamentos e emissão de nota fiscal; (c) envio de comunicações relacionadas aos cursos adquiridos; (d) melhoria contínua da plataforma.",
  },
  {
    title: "3. Compartilhamento de dados",
    text: "Não vendemos nem compartilhamos seus dados com terceiros, exceto quando necessário para a prestação dos serviços (ex.: processadores de pagamento Stripe e Mercado Pago) ou por obrigação legal.",
  },
  {
    title: "4. Armazenamento e segurança",
    text: "Os dados são armazenados em servidores seguros com criptografia em trânsito (HTTPS/TLS). Adotamos medidas técnicas e organizacionais adequadas para proteger as informações contra acesso não autorizado.",
  },
  {
    title: "5. Direitos do titular",
    text: "Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode a qualquer momento solicitar: acesso aos seus dados, correção, exclusão, portabilidade ou revogação do consentimento. Basta enviar e-mail para cursos@nuvemensino.com.br.",
  },
  {
    title: "6. Cookies",
    text: "Utilizamos cookies essenciais para o funcionamento da plataforma (autenticação e preferências) e cookies analíticos para entender o uso do site. Você pode desativar cookies nas configurações do seu navegador, o que pode afetar algumas funcionalidades.",
  },
  {
    title: "7. Retenção de dados",
    text: "Os dados são mantidos enquanto a conta estiver ativa. Após o encerramento, os dados são excluídos em até 90 dias, salvo obrigação legal de retenção por prazo maior.",
  },
  {
    title: "8. Contato",
    text: "Para dúvidas sobre esta política ou para exercer seus direitos, entre em contato: cursos@nuvemensino.com.br | (31) 2537-3131.",
  },
];

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen">
      <section className="bg-canvas px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-4xl font-light text-white mb-3">Política de Privacidade</h1>
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
      </section>
    </div>
  );
}
