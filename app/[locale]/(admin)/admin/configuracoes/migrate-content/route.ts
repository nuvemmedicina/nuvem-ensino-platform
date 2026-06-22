import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const staticContent: Record<
  string,
  { objectives: string[]; targetAudience: string[]; includes: string[]; startDate: string | null }
> = {
  "manometria-phmetria-impedancia": {
    startDate: "15–19 de junho de 2026",
    objectives: [
      "Realizar manometria esofágica de alta resolução com autonomia e segurança",
      "Interpretar laudos de pHmetria de 24 horas e impedancio-pHmetria",
      "Classificar padrões de motilidade segundo a Classificação de Chicago 4.0",
      "Abordar disfagia pós-cirúrgica (fundoplicatura e cirurgia bariátrica)",
      "Diagnosticar e manejar acalasia e disfagia por doença de Chagas",
      "Correlacionar achados funcionais com o quadro clínico do paciente",
    ],
    targetAudience: [
      "Médicos gastroenterologistas",
      "Cirurgiões digestivos e esofagogástricos",
      "Endoscopistas",
      "Médicos com interesse em motilidade digestiva e disfagia",
    ],
    includes: [
      "5 dias de imersão teórico-prática (15 a 19 de junho de 2026)",
      "Exames em pacientes reais com mentoria direta do Dr. Felipe Nelson",
      "Hands On diário de manometria esofágica de alta resolução, pHmetria e impedância",
      "Material de apoio completo",
      "Coffee break diário",
      "Certificado de conclusão",
    ],
  },
  "manometria-anorretal": {
    startDate: null,
    objectives: [
      "Dominar a técnica de manometria anorretal de alta resolução",
      "Interpretar perfis de pressão e reflexo retoanal",
      "Diagnosticar incontinência fecal, constipação funcional e dissinergias",
      "Correlacionar achados com biofeedback e tratamento conservador",
    ],
    targetAudience: [
      "Coloproctologistas",
      "Gastroenterologistas",
      "Fisioterapeutas pélvicos",
      "Ginecologistas com interesse em assoalho pélvico",
    ],
    includes: [
      "12h de treinamento presencial supervisionado",
      "Material didático digital",
      "Acesso a atlas de laudos comentados",
      "Certificado digital com QR Code",
      "Coffee break",
      "Grupo de suporte pós-curso",
    ],
  },
  "testes-respiratorios": {
    startDate: null,
    objectives: [
      "Dominar os novos protocolos de teste respiratório de hidrogênio e metano",
      "Interpretar laudos com precisão e correlacionar com quadro clínico",
      "Compreender e aplicar os últimos guidelines internacionais",
      "Analisar casos clínicos desafiadores com raciocínio diagnóstico avançado",
    ],
    targetAudience: [
      "Médicos gastroenterologistas",
      "Clínicos gerais e internistas",
      "Nutrólogos e nutricionistas clínicos",
      "Profissionais de saúde com interesse em diagnóstico funcional digestivo",
    ],
    includes: [
      "3h15min de aula gravada com acesso imediato",
      "5 aulas práticas com casos clínicos reais",
      "Certificado de participação com nota fiscal",
      "Acesso ao conteúdo por tempo indeterminado",
      "Material de apoio em PDF",
    ],
  },
  "doencas-da-cavidade-oral-halimetria-e-sialometria": {
    startDate: null,
    objectives: [
      "Diagnosticar e tratar candidose oral, úlceras aftosas e lesões brancas",
      "Identificar manifestações orais de doenças sistêmicas",
      "Realizar e interpretar halimetria na prática clínica",
      "Avaliar e manejar xerostomia e halitose com protocolos atualizados",
      "Realizar sialometria e interpretar o fluxo salivar estimulado e não estimulado",
    ],
    targetAudience: [
      "Médicos gastroenterologistas e clínicos gerais",
      "Dentistas e cirurgiões bucomaxilofaciais",
      "Otorrinolaringologistas",
      "Estudantes de medicina e odontologia (último ano)",
    ],
    includes: [
      "3h de aula gravada com acesso imediato",
      "Ministrado por Dr. Wanderley Bertoni",
      "Certificado de conclusão",
      "Nota fiscal para declaração de imposto de renda",
      "Acesso ao conteúdo por tempo indeterminado",
    ],
  },
  "testes-respiratorios-h2-ch4-h2s-junho": {
    startDate: "19–20 de junho de 2026",
    objectives: [
      "Diagnosticar intolerâncias alimentares (lactose, frutose, frutanas, sacarose) com precisão",
      "Identificar e diferenciar SIBO, IMO, LIBO e SIFO pelos critérios atualizados",
      "Operar com autonomia os equipamentos Dynamed e Health Go",
      "Elaborar e interpretar laudos de testes respiratórios de H₂, CH₄ e H₂S",
      "Implantar ou aprimorar um serviço de testes respiratórios na sua clínica",
      "Aplicar as atualizações do DDW 2026 na prática clínica",
    ],
    targetAudience: [
      "Médicos que desejam implantar testes respiratórios na clínica",
      "Gastroenterologistas e clínicos gerais",
      "Nutrólogos e nutricionistas clínicos",
      "Profissionais interessados em diagnóstico funcional digestivo",
    ],
    includes: [
      "8h de treinamento teórico-prático (19 e 20 de junho de 2026)",
      "Prática supervisionada com equipamentos Dynamed e Health Go",
      "Material didático completo",
      "Coffee break e almoço incluídos",
      "Certificado de conclusão",
      "Atualizações DDW 2026",
    ],
  },
  "desvendando-a-constipacao-intestinal": {
    startDate: null,
    objectives: [
      "Aplicar corretamente os critérios Roma IV no diagnóstico da constipação",
      "Interpretar o tempo de trânsito colônico e seus padrões",
      "Correlacionar achados de manometria anorretal com o quadro clínico",
      "Elaborar planos de tratamento individualizados baseados nos exames",
      "Diferenciar constipação funcional de dissinergias do assoalho pélvico",
    ],
    targetAudience: [
      "Gastroenterologistas e coloproctologistas",
      "Clínicos gerais e internistas",
      "Fisioterapeutas pélvicos",
      "Médicos em formação com interesse em funcional digestiva",
    ],
    includes: [
      "3h de aula gravada com acesso imediato",
      "Ministrado por Dra. Eliane Basques",
      "Certificado de participação",
      "Nota fiscal para declaração de imposto de renda",
      "Acesso ao conteúdo por tempo indeterminado",
    ],
  },
  "fisioterapia-respiratoria": {
    startDate: "17–19 de junho de 2026",
    objectives: [
      "Dominar a anatomia detalhada e a biomecânica do assoalho pélvico",
      "Realizar avaliação clínica e instrumental com assertividade",
      "Aplicar estratégias terapêuticas baseadas em evidências atuais",
      "Analisar casos clínicos reais e discutir atualizações de protocolo",
      "Executar práticas clínicas supervisionadas com autonomia",
    ],
    targetAudience: [
      "Fisioterapeutas que atuam ou desejam atuar com assoalho pélvico",
      "Profissionais de saúde com interesse em reabilitação pélvica",
      "Fisioterapeutas em busca de especialização prática e científica",
    ],
    includes: [
      "30h de treinamento teórico-prático (17 a 19 de junho de 2026)",
      "Turmas com no máximo 2 alunos por data, com atenção individualizada",
      "Certificado de conclusão",
      "Material de apoio digital",
      "Suporte pós-curso",
    ],
  },
};

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const results: { slug: string; status: string }[] = [];

  for (const [slug, content] of Object.entries(staticContent)) {
    const course = await prisma.course.findUnique({ where: { slug } });

    if (!course) {
      results.push({ slug, status: "não encontrado no banco" });
      continue;
    }

    await prisma.course.update({
      where: { slug },
      data: {
        objectives:     course.objectives     ?? content.objectives.join("\n"),
        targetAudience: course.targetAudience ?? content.targetAudience.join("\n"),
        includes:       course.includes       ?? content.includes.join("\n"),
        startDateLabel: course.startDateLabel ?? content.startDate ?? undefined,
      },
    });

    results.push({ slug, status: "migrado" });
  }

  return NextResponse.json({ ok: true, results });
}
