import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const slug = "dici-neurogastroenterologia-2026";

  const existing = await prisma.course.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ ok: false, message: "Curso já existe.", id: existing.id });
  }

  const instructor = await prisma.instructor.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!instructor) {
    return NextResponse.json({ error: "Nenhum instrutor encontrado no banco." }, { status: 400 });
  }

  const course = await prisma.course.create({
    data: {
      slug,
      title: "Curso de Aperfeiçoamento em DICI: Neurogastroenterologia e Métodos Diagnósticos Complementares",
      shortDesc: "96h | Certificado MEC/FACOP | Agosto a novembro de 2026 | Online com encontros síncronos",
      description:
        "Os Distúrbios da Interação Cérebro-Intestino (DICI) constituem um grupo de condições caracterizadas por alterações na comunicação bidirecional entre o sistema nervoso central, o sistema nervoso entérico, a microbiota intestinal, a imunidade da mucosa, a motilidade gastrointestinal e a sensibilidade visceral. Reconhecidos pelos Critérios de Roma V, os DICI incluem condições altamente prevalentes como síndrome do intestino irritável, dispepsia funcional, constipação funcional, diarreia funcional e distensão abdominal funcional.\n\nEste curso de aperfeiçoamento foi desenvolvido para capacitar profissionais da saúde a compreender, diagnosticar e manejar os principais DICI, utilizando ferramentas diagnósticas modernas e estratégias terapêuticas atualizadas. O conteúdo é ministrado por especialistas, mestres e doutores de instituições de referência, com metodologia ativa combinando aulas expositivas dialogadas, análise crítica da literatura científica, discussão de casos clínicos reais e encontros síncronos quinzenais.",
      hours: 96,
      price: 2998.00,
      category: "ONLINE",
      status: "PUBLISHED",
      instructorId: instructor.id,
      startDateLabel: "Agosto a novembro de 2026",
      location: "Online (plataforma NU.V.E.M ENSINO) com encontros síncronos ao vivo",
      objectives: [
        "Compreender a fisiopatologia dos Distúrbios da Interação Cérebro-Intestino (DICI) com base nos Critérios de Roma V",
        "Diagnosticar e manejar os principais DICI: síndrome do intestino irritável, dispepsia funcional, constipação funcional e diarreia funcional",
        "Interpretar e aplicar os resultados dos testes respiratórios para SIBO, IMO, intolerâncias alimentares e H. pylori",
        "Dominar os exames complementares em neurogastroenterologia: manometria esofágica, pHmetria e manometria anorretal",
        "Diagnosticar e tratar distúrbios da defecação e do assoalho pélvico",
        "Aplicar estratégias terapêuticas atualizadas baseadas em evidências para os DICI",
        "Compreender o eixo cérebro-intestino-microbiota e sua relevância clínica",
        "Utilizar critérios de avaliação e raciocínio clínico estruturado no manejo do paciente com DICI",
      ].join("\n"),
      targetAudience: [
        "Médicos gastroenterologistas e clínicos gerais",
        "Nutricionistas com interesse em saúde digestiva funcional",
        "Enfermeiros com atuação em gastroenterologia",
        "Fisioterapeutas pélvicos e especializados em motilidade digestiva",
        "Outros profissionais da área da saúde interessados em neurogastroenterologia",
      ].join("\n"),
      includes: [
        "96 horas de carga horária total (agosto a novembro de 2026)",
        "16 aulas gravadas distribuídas em 4 módulos de 20 horas cada",
        "Módulos Bônus — 'Como eu faço' — com 16 horas de conteúdo prático",
        "Encontros síncronos quinzenais para discussão de casos clínicos e esclarecimento de dúvidas",
        "Avaliações online ao término de cada módulo",
        "Certificado de Conclusão emitido pela FACOP — instituição credenciada pelo MEC",
        "Material complementar atualizado disponibilizado ao longo do curso",
        "Acesso à plataforma NU.V.E.M ENSINO durante todo o período do curso",
        "⚠ Direitos autorais: é proibida a reprodução total ou parcial das aulas por qualquer meio ou processo. A violação constitui crime (Código Penal, art. 184 e Lei nº 9.610/98), sujeitando-se à busca, apreensão e indenizações.",
      ].join("\n"),
      metaTitle: "Curso DICI: Neurogastroenterologia e Métodos Diagnósticos | NU.V.E.M ENSINO",
      metaDesc:
        "Curso de Aperfeiçoamento em Distúrbios da Interação Cérebro-Intestino. 96h, certificado MEC/FACOP. Online com encontros síncronos. Agosto a novembro de 2026.",
    },
  });

  const modules = [
    {
      title: "Módulo I — Fundamentos dos Distúrbios da Interação Cérebro-Intestino",
      description: "20 horas",
      order: 1,
      lessons: [
        { title: "Aula 1 — Introdução aos DICI e Critérios de Roma", order: 1 },
        { title: "Aula 2 — Fisiopatologia dos DICI", order: 2 },
        { title: "Aula 3 — Eixo Cérebro-Intestino-Microbiota", order: 3 },
        { title: "Aula 4 — Abordagem Clínica do Paciente com DICI", order: 4 },
        { title: "Encontro Síncrono — Discussão de Casos Clínicos", order: 5 },
      ],
    },
    {
      title: "Módulo II — DICI na Prática Clínica",
      description: "20 horas",
      order: 2,
      lessons: [
        { title: "Aula 1 — Distúrbios Esofágicos", order: 1 },
        { title: "Aula 2 — Distúrbios Gastroduodenais", order: 2 },
        { title: "Aula 3 — Náuseas, Vômitos e Gastroparesia", order: 3 },
        { title: "Aula 4 — Distúrbios Intestinais", order: 4 },
        { title: "Encontro Síncrono — Discussão de Casos Clínicos", order: 5 },
      ],
    },
    {
      title: "Módulo III — Arsenal Diagnóstico em Neurogastroenterologia",
      description: "20 horas",
      order: 3,
      lessons: [
        { title: "Aula 1 — Testes Respiratórios para Supercrescimento Microbiano (SIBO, IMO, ISO)", order: 1 },
        { title: "Aula 2 — Testes Respiratórios para Intolerâncias Alimentares", order: 2 },
        { title: "Aula 3 — Teste Respiratório para Helicobacter pylori", order: 3 },
        { title: "Aula 4 — Exames Complementares Esofágicos (Manometria, pHmetria, Impedanciometria)", order: 4 },
        { title: "Encontro Síncrono — Discussão de Casos Clínicos", order: 5 },
      ],
    },
    {
      title: "Módulo IV — Distúrbios da Defecação e Assoalho Pélvico",
      description: "20 horas",
      order: 4,
      lessons: [
        { title: "Aula 1 — Anatomia e Fisiologia da Defecação", order: 1 },
        { title: "Aula 2 — Principais Distúrbios da Defecação", order: 2 },
        { title: "Aula 3 — Métodos Diagnósticos (Manometria Anorretal, Tempo de Trânsito Colônico)", order: 3 },
        { title: "Aula 4 — Tratamento dos Distúrbios da Defecação", order: 4 },
        { title: "Encontro Síncrono — Discussão de Casos Clínicos", order: 5 },
      ],
    },
    {
      title: "Módulos Bônus — Como Eu Faço",
      description: "16 horas — liberação em dezembro de 2026",
      order: 5,
      lessons: [
        { title: "Bônus I — Disbiose: como eu investigo e trato?", order: 1 },
        { title: "Bônus II — Intolerâncias alimentares: como eu raciocino", order: 2 },
        { title: "Bônus III — Probióticos: como eu prescrevo", order: 3 },
        { title: "Bônus IV — Terapêuticas complementares: como eu utilizo na prática", order: 4 },
      ],
    },
  ];

  for (const mod of modules) {
    const createdModule = await prisma.module.create({
      data: {
        courseId: course.id,
        title: mod.title,
        description: mod.description,
        order: mod.order,
      },
    });

    for (const lesson of mod.lessons) {
      await prisma.lesson.create({
        data: {
          moduleId: createdModule.id,
          title: lesson.title,
          order: lesson.order,
          type: "VIDEO",
        },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    message: "Curso DICI criado com sucesso.",
    slug,
    id: course.id,
    modulesCreated: modules.length,
    lessonsCreated: modules.reduce((acc, m) => acc + m.lessons.length, 0),
  });
}
