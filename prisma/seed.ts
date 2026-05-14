import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import "dotenv/config";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ── Instrutores (usuários) ───────────────────────────────────────────────
  const vera = await prisma.user.upsert({
    where: { email: "vera.angelo@nuvemensino.com.br" },
    update: {},
    create: {
      name: "Dra. Vera Ângelo",
      email: "vera.angelo@nuvemensino.com.br",
      role: "INSTRUCTOR",
      image: "/instructors/dra-vera.jpg",
    },
  });

  const eliane = await prisma.user.upsert({
    where: { email: "eliane.basques@nuvemensino.com.br" },
    update: {},
    create: {
      name: "Dra. Eliane Basques",
      email: "eliane.basques@nuvemensino.com.br",
      role: "INSTRUCTOR",
      image: "/instructors/dra-eliane.jpg",
    },
  });

  const anna = await prisma.user.upsert({
    where: { email: "anna.karoline@nuvemensino.com.br" },
    update: {},
    create: {
      name: "Dra. Anna Karoline",
      email: "anna.karoline@nuvemensino.com.br",
      role: "INSTRUCTOR",
      image: "/instructors/anna-karoline.jpg",
    },
  });

  const felipe = await prisma.user.upsert({
    where: { email: "felipe.nelson@nuvemensino.com.br" },
    update: {},
    create: {
      name: "Dr. Felipe Nelson",
      email: "felipe.nelson@nuvemensino.com.br",
      role: "INSTRUCTOR",
      image: "/instructors/felipe-nelson.jpg",
    },
  });

  const wanderley = await prisma.user.upsert({
    where: { email: "wanderley.bertoni@nuvemensino.com.br" },
    update: {},
    create: {
      name: "Dr. Wanderley Bertoni",
      email: "wanderley.bertoni@nuvemensino.com.br",
      role: "INSTRUCTOR",
      image: "/instructors/vera-wanderley.jpg",
    },
  });

  // ── Perfis de instrutor ──────────────────────────────────────────────────
  const instructorVera = await prisma.instructor.upsert({
    where: { userId: vera.id },
    update: {},
    create: {
      userId: vera.id,
      slug: "dra-vera-angelo",
      title: "Gastroenterologista & Motilidade Digestiva",
      crm: "CRM-MG 22284",
      rqe: "RQE 10411 · RQE 22736",
      photoUrl: "/instructors/dra-vera.jpg",
    },
  });

  const instructorEliane = await prisma.instructor.upsert({
    where: { userId: eliane.id },
    update: {},
    create: {
      userId: eliane.id,
      slug: "dra-eliane-basques",
      title: "Especialista em Manometria Anorretal",
      crm: "CRM-MG",
      photoUrl: "/instructors/dra-eliane.jpg",
    },
  });

  const instructorAnna = await prisma.instructor.upsert({
    where: { userId: anna.id },
    update: {},
    create: {
      userId: anna.id,
      slug: "dra-anna-karoline",
      title: "Fisioterapeuta Respiratória",
      photoUrl: "/instructors/anna-karoline.jpg",
    },
  });

  const instructorFelipe = await prisma.instructor.upsert({
    where: { userId: felipe.id },
    update: {},
    create: {
      userId: felipe.id,
      slug: "dr-felipe-nelson",
      title: "Motilidade Digestiva, pHmetria e Impedância",
      crm: "CRM-MG",
      photoUrl: "/instructors/felipe-nelson.jpg",
    },
  });

  const instructorWanderley = await prisma.instructor.upsert({
    where: { userId: wanderley.id },
    update: {},
    create: {
      userId: wanderley.id,
      slug: "dr-wanderley-bertoni",
      title: "Gastroenterologista & Endoscopia Digestiva",
      crm: "CRM",
      rqe: "RQE 24610 · RQE 38052",
      photoUrl: "/instructors/vera-wanderley.jpg",
    },
  });

  // ── Tags ─────────────────────────────────────────────────────────────────
  const tagGastro = await prisma.tag.upsert({
    where: { slug: "gastroenterologia" },
    update: {},
    create: { name: "Gastroenterologia", slug: "gastroenterologia" },
  });

  const tagFisio = await prisma.tag.upsert({
    where: { slug: "fisioterapia" },
    update: {},
    create: { name: "Fisioterapia", slug: "fisioterapia" },
  });

  const tagMotilidade = await prisma.tag.upsert({
    where: { slug: "motilidade-digestiva" },
    update: {},
    create: { name: "Motilidade Digestiva", slug: "motilidade-digestiva" },
  });

  // ── Cursos ───────────────────────────────────────────────────────────────
  const courseManometria = await prisma.course.upsert({
    where: { slug: "manometria-phmetria-impedancia" },
    update: {},
    create: {
      slug: "manometria-phmetria-impedancia",
      title: "Manometria, pHmetria e Impedância",
      description:
        "Domine os principais exames de motilidade digestiva: manometria de alta resolução, pHmetria e impedância em ambiente clínico supervisionado.",
      shortDesc: "Treinamento hands-on em exames de motilidade digestiva de alta resolução.",
      price: 6500,
      hours: 16,
      category: "HANDS_ON",
      status: "PUBLISHED",
      instructorId: instructorFelipe.id,
      totalSeats: 12,
      reservedSeats: 7,
      thumbnailUrl: "/instructors/felipe-nelson.jpg",
      location: "NU.V.E.M Medicina · Belo Horizonte, MG",
      metaTitle: "Manometria, pHmetria e Impedância | Nuvem Ensino",
      metaDesc:
        "Curso hands-on de manometria esofágica de alta resolução, pHmetria e impedancio-pHmetria com Dr. Felipe Nelson.",
    },
  });

  const courseAnorretal = await prisma.course.upsert({
    where: { slug: "manometria-anorretal" },
    update: { status: "DRAFT" },
    create: {
      slug: "manometria-anorretal",
      title: "Manometria Anorretal",
      description:
        "Técnicas avançadas de manometria anorretal de alta resolução com interpretação clínica aplicada ao diagnóstico de distúrbios funcionais.",
      shortDesc: "Técnicas de manometria anorretal de alta resolução com interpretação clínica.",
      price: 4500,
      hours: 12,
      category: "HANDS_ON",
      status: "DRAFT",
      instructorId: instructorEliane.id,
      totalSeats: 10,
      reservedSeats: 4,
      thumbnailUrl: "/instructors/dra-eliane.jpg",
      location: "NU.V.E.M Medicina · Belo Horizonte, MG",
      metaTitle: "Manometria Anorretal | Nuvem Ensino",
      metaDesc:
        "Curso hands-on de manometria anorretal de alta resolução com Dra. Eliane Basques.",
    },
  });

  const courseRespiratorio = await prisma.course.upsert({
    where: { slug: "testes-respiratorios" },
    update: {
      title: "Aperfeiçoamento Teórico em Teste Respiratório Hidrogênio e Metano – Novos Protocolos",
      description:
        "Atualize seus conhecimentos e domine as novas técnicas de teste respiratório de hidrogênio e metano, aprendendo protocolos modernos e interpretação de laudos com precisão.",
      shortDesc: "Domine os novos protocolos de teste respiratório de H₂/CH₄ com interpretação de laudos e casos clínicos reais.",
      price: 450,
      hours: 3,
      metaTitle: "Aperfeiçoamento em Teste Respiratório Hidrogênio e Metano | Nuvem Ensino",
      metaDesc:
        "Curso online com Dra. Vera Ângelo: novos protocolos de teste respiratório de hidrogênio e metano, interpretação de laudos e guidelines internacionais.",
    },
    create: {
      slug: "testes-respiratorios",
      title: "Aperfeiçoamento Teórico em Teste Respiratório Hidrogênio e Metano – Novos Protocolos",
      description:
        "Atualize seus conhecimentos e domine as novas técnicas de teste respiratório de hidrogênio e metano, aprendendo protocolos modernos e interpretação de laudos com precisão.",
      shortDesc: "Domine os novos protocolos de teste respiratório de H₂/CH₄ com interpretação de laudos e casos clínicos reais.",
      price: 450,
      hours: 3,
      category: "ONLINE",
      status: "PUBLISHED",
      instructorId: instructorVera.id,
      thumbnailUrl: "/instructors/dra-vera.jpg",
      metaTitle: "Aperfeiçoamento em Teste Respiratório Hidrogênio e Metano | Nuvem Ensino",
      metaDesc:
        "Curso online com Dra. Vera Ângelo: novos protocolos de teste respiratório de hidrogênio e metano, interpretação de laudos e guidelines internacionais.",
    },
  });

  const courseFisioterapia = await prisma.course.upsert({
    where: { slug: "fisioterapia-respiratoria" },
    update: {
      title: "Treinamento Teórico-Prático de Fisioterapia nas Disfunções do Assoalho Pélvico",
      description:
        "Formação teórico-prática em fisioterapia pélvica: anatomia, avaliação clínica e instrumental, estratégias terapêuticas baseadas em evidências, discussão de casos reais e prática supervisionada. Turmas com no máximo 2 alunos.",
      shortDesc: "Treinamento hands-on em disfunções do assoalho pélvico com Dra. Karol Rocha. Turmas com máximo 2 alunos.",
      hours: 30,
      metaTitle: "Fisioterapia nas Disfunções do Assoalho Pélvico | Nuvem Ensino",
      metaDesc:
        "Treinamento teórico-prático com Dra. Karol Rocha: avaliação, tratamento e prática supervisionada em disfunções do assoalho pélvico.",
    },
    create: {
      slug: "fisioterapia-respiratoria",
      title: "Treinamento Teórico-Prático de Fisioterapia nas Disfunções do Assoalho Pélvico",
      description:
        "Formação teórico-prática em fisioterapia pélvica: anatomia, avaliação clínica e instrumental, estratégias terapêuticas baseadas em evidências, discussão de casos reais e prática supervisionada. Turmas com no máximo 2 alunos.",
      shortDesc: "Treinamento hands-on em disfunções do assoalho pélvico com Dra. Karol Rocha. Turmas com máximo 2 alunos.",
      price: 3500,
      hours: 30,
      category: "HANDS_ON",
      status: "PUBLISHED",
      instructorId: instructorAnna.id,
      totalSeats: 2,
      reservedSeats: 0,
      location: "NU.V.E.M Medicina · Belo Horizonte, MG",
      metaTitle: "Fisioterapia nas Disfunções do Assoalho Pélvico | Nuvem Ensino",
      metaDesc:
        "Treinamento teórico-prático com Dra. Karol Rocha: avaliação, tratamento e prática supervisionada em disfunções do assoalho pélvico.",
    },
  });

  const courseCavidadeOral = await prisma.course.upsert({
    where: { slug: "doencas-da-cavidade-oral-halimetria-e-sialometria" },
    update: {
      title: "Doenças da Cavidade Oral, Halimetria e Sialometria",
      description:
        "Curso online com Dra. Vera Ângelo e Dr. Wanderley Bertoni: domine o diagnóstico e manejo das principais doenças da cavidade oral, candidose, úlceras aftosas recorrentes, lesões brancas, xerostomia e halitose. Aprenda halimetria e sialometria na prática clínica.",
      shortDesc: "Diagnóstico e manejo de doenças da cavidade oral, halitose e fluxo salivar com Dra. Vera Ângelo e Dr. Wanderley Bertoni.",
      price: 450,
      hours: 3,
      status: "PUBLISHED",
      previewUrl: null,
    },
    create: {
      slug: "doencas-da-cavidade-oral-halimetria-e-sialometria",
      title: "Doenças da Cavidade Oral, Halimetria e Sialometria",
      description:
        "Curso online com Dra. Vera Ângelo e Dr. Wanderley Bertoni: domine o diagnóstico e manejo das principais doenças da cavidade oral, candidose, úlceras aftosas recorrentes, lesões brancas, xerostomia e halitose. Aprenda halimetria e sialometria na prática clínica.",
      shortDesc: "Diagnóstico e manejo de doenças da cavidade oral, halitose e fluxo salivar com Dra. Vera Ângelo e Dr. Wanderley Bertoni.",
      price: 450,
      hours: 3,
      category: "ONLINE",
      status: "PUBLISHED",
      instructorId: instructorWanderley.id,
      thumbnailUrl: "/instructors/vera-wanderley.jpg",
      metaTitle: "Doenças da Cavidade Oral, Halimetria e Sialometria | Nuvem Ensino",
      metaDesc:
        "Curso online: diagnóstico de doenças da cavidade oral, halitose, xerostomia, candidose, úlceras aftosas e técnicas de halimetria e sialometria.",
    },
  });

  const courseTestesPresencial = await prisma.course.upsert({
    where: { slug: "testes-respiratorios-h2-ch4-h2s-junho" },
    update: {
      title: "Turma de Junho: Testes Respiratórios de H₂, CH₄ e H₂S",
      description:
        "Treinamento teórico-prático completo em testes respiratórios de H₂, CH₄ e H₂S com a Dra. Vera Ângelo. Domine o diagnóstico de intolerâncias alimentares, SIBO, IMO, LIBO e SIFO, incluindo prática supervisionada com equipamentos Dynamed e Health Go e atualizações do DDW 2025.",
      shortDesc: "Treinamento presencial em testes respiratórios H₂/CH₄/H₂S: intolerâncias, SIBO, IMO, laudos e prática supervisionada com equipamentos reais.",
      price: 2200,
      hours: 8,
      status: "PUBLISHED",
    },
    create: {
      slug: "testes-respiratorios-h2-ch4-h2s-junho",
      title: "Turma de Junho: Testes Respiratórios de H₂, CH₄ e H₂S",
      description:
        "Treinamento teórico-prático completo em testes respiratórios de H₂, CH₄ e H₂S com a Dra. Vera Ângelo. Domine o diagnóstico de intolerâncias alimentares, SIBO, IMO, LIBO e SIFO, incluindo prática supervisionada com equipamentos Dynamed e Health Go e atualizações do DDW 2025.",
      shortDesc: "Treinamento presencial em testes respiratórios H₂/CH₄/H₂S: intolerâncias, SIBO, IMO, laudos e prática supervisionada com equipamentos reais.",
      price: 2200,
      hours: 8,
      category: "HANDS_ON",
      status: "PUBLISHED",
      instructorId: instructorVera.id,
      thumbnailUrl: "/instructors/dra-vera.jpg",
      location: "NU.V.E.M Medicina · Belo Horizonte, MG",
      metaTitle: "Testes Respiratórios H₂, CH₄ e H₂S — Turma Junho 2026 | Nuvem Ensino",
      metaDesc:
        "Curso presencial com Dra. Vera Ângelo: testes respiratórios de hidrogênio, metano e H₂S, intolerâncias alimentares, SIBO, IMO, laudos e prática supervisionada.",
    },
  });

  const courseConstipacao = await prisma.course.upsert({
    where: { slug: "desvendando-a-constipacao-intestinal" },
    update: {
      title: "Desvendando a Constipação Intestinal, Classificação Roma IV, Tempo de Trânsito Colônico e Manometria Anorretal",
      description:
        "Domine a abordagem diagnóstica da constipação intestinal: aplique corretamente a Classificação Roma IV na prática clínica, interprete o tempo de trânsito colônico e correlacione achados de manometria anorretal para traçar planos de tratamento individualizados.",
      shortDesc: "Aplique a Classificação Roma IV, interprete exames complementares e elabore planos de tratamento para constipação intestinal.",
      price: 380,
      hours: 3,
      previewUrl: "https://www.youtube.com/embed/J5dI4R3xCws",
      metaTitle: "Desvendando a Constipação Intestinal | Nuvem Ensino",
      metaDesc:
        "Curso online com Dra. Vera Ângelo e Dra. Eliane Basques: Roma IV, tempo de trânsito colônico e manometria anorretal aplicados ao diagnóstico da constipação.",
    },
    create: {
      slug: "desvendando-a-constipacao-intestinal",
      title: "Desvendando a Constipação Intestinal, Classificação Roma IV, Tempo de Trânsito Colônico e Manometria Anorretal",
      description:
        "Domine a abordagem diagnóstica da constipação intestinal: aplique corretamente a Classificação Roma IV na prática clínica, interprete o tempo de trânsito colônico e correlacione achados de manometria anorretal para traçar planos de tratamento individualizados.",
      shortDesc: "Aplique a Classificação Roma IV, interprete exames complementares e elabore planos de tratamento para constipação intestinal.",
      price: 380,
      hours: 3,
      category: "ONLINE",
      status: "PUBLISHED",
      instructorId: instructorEliane.id,
      thumbnailUrl: "/instructors/dra-eliane.jpg",
      previewUrl: "https://www.youtube.com/embed/J5dI4R3xCws",
      metaTitle: "Desvendando a Constipação Intestinal | Nuvem Ensino",
      metaDesc:
        "Curso online com Dra. Vera Ângelo e Dra. Eliane Basques: Roma IV, tempo de trânsito colônico e manometria anorretal aplicados ao diagnóstico da constipação.",
    },
  });

  // ── Tags nos cursos ──────────────────────────────────────────────────────
  await prisma.courseTag.createMany({
    skipDuplicates: true,
    data: [
      { courseId: courseManometria.id, tagId: tagGastro.id },
      { courseId: courseManometria.id, tagId: tagMotilidade.id },
      { courseId: courseAnorretal.id, tagId: tagGastro.id },
      { courseId: courseAnorretal.id, tagId: tagMotilidade.id },
      { courseId: courseRespiratorio.id, tagId: tagFisio.id },
      { courseId: courseFisioterapia.id, tagId: tagFisio.id },
      { courseId: courseConstipacao.id, tagId: tagGastro.id },
      { courseId: courseConstipacao.id, tagId: tagMotilidade.id },
      { courseId: courseTestesPresencial.id, tagId: tagGastro.id },
      { courseId: courseTestesPresencial.id, tagId: tagMotilidade.id },
      { courseId: courseCavidadeOral.id, tagId: tagGastro.id },
    ],
  });

  // ── Cupom de demonstração ────────────────────────────────────────────────
  await prisma.coupon.upsert({
    where: { code: "NUVEM10" },
    update: {},
    create: {
      code: "NUVEM10",
      discountPct: 10,
      maxUses: 100,
      active: true,
    },
  });

  // ── Módulos e Aulas ──────────────────────────────────────────────────────
  // Curso: Manometria, pHmetria e Impedância
  const modulesManometria = [
    {
      title: "Módulo 1: Fundamentos",
      order: 1,
      lessons: [
        { title: "Anatomia e fisiologia da motilidade esofágica", order: 1, duration: 18 },
        { title: "Indicações, contraindicações e preparo do paciente", order: 2, duration: 14 },
        { title: "Classificação de Chicago v4.0", order: 3, duration: 22 },
      ],
    },
    {
      title: "Módulo 2: Manometria na Prática",
      order: 2,
      lessons: [
        { title: "Montagem do equipamento e cateter", order: 1, duration: 20 },
        { title: "Realização do exame supervisionado", order: 2, duration: 35 },
        { title: "Interpretação e laudo em tempo real", order: 3, duration: 28 },
      ],
    },
    {
      title: "Módulo 3: pHmetria e Impedância",
      order: 3,
      lessons: [
        { title: "Fundamentos de pHmetria esofágica", order: 1, duration: 16 },
        { title: "Impedancio-pHmetria: posicionamento e análise", order: 2, duration: 24 },
        { title: "Interpretação de laudos e correlação clínica", order: 3, duration: 30 },
      ],
    },
    {
      title: "Módulo 4: Casos Clínicos",
      order: 4,
      lessons: [
        { title: "Revisão de laudos reais, Parte 1", order: 1, duration: 40 },
        { title: "Revisão de laudos reais, Parte 2", order: 2, duration: 38 },
        { title: "Discussão multidisciplinar e avaliação final", order: 3, duration: 25 },
      ],
    },
  ];

  for (const mod of modulesManometria) {
    const existingModule = await prisma.module.findFirst({
      where: { courseId: courseManometria.id, order: mod.order },
    });
    const dbModule = existingModule ?? await prisma.module.create({
      data: { courseId: courseManometria.id, title: mod.title, order: mod.order },
    });
    for (const lesson of mod.lessons) {
      const existing = await prisma.lesson.findFirst({
        where: { moduleId: dbModule.id, order: lesson.order },
      });
      if (!existing) {
        await prisma.lesson.create({
          data: {
            moduleId: dbModule.id,
            title: lesson.title,
            order: lesson.order,
            duration: lesson.duration,
            type: "VIDEO",
            isFree: lesson.order === 1 && mod.order === 1,
          },
        });
      }
    }
  }

  // Curso: Manometria Anorretal
  const modulesAnorretal = [
    {
      title: "Módulo 1: Bases da Fisiologia Anorretal",
      order: 1,
      lessons: [
        { title: "Anatomia e neurofisiologia do assoalho pélvico", order: 1, duration: 20 },
        { title: "Indicações e contraindicações", order: 2, duration: 12 },
        { title: "Preparo e posicionamento do paciente", order: 3, duration: 10 },
      ],
    },
    {
      title: "Módulo 2: Técnica e Prática",
      order: 2,
      lessons: [
        { title: "Calibração e montagem do cateter", order: 1, duration: 18 },
        { title: "Realização do exame supervisionado", order: 2, duration: 32 },
        { title: "Protocolos de pressão e sensação retal", order: 3, duration: 22 },
      ],
    },
    {
      title: "Módulo 3: Interpretação e Laudos",
      order: 3,
      lessons: [
        { title: "Análise de traçados de alta resolução", order: 1, duration: 28 },
        { title: "Laudos comentados e diagnósticos diferenciais", order: 2, duration: 35 },
        { title: "Integração com outros exames funcionais", order: 3, duration: 20 },
      ],
    },
  ];

  for (const mod of modulesAnorretal) {
    const existingModule = await prisma.module.findFirst({
      where: { courseId: courseAnorretal.id, order: mod.order },
    });
    const dbModule = existingModule ?? await prisma.module.create({
      data: { courseId: courseAnorretal.id, title: mod.title, order: mod.order },
    });
    for (const lesson of mod.lessons) {
      const existing = await prisma.lesson.findFirst({
        where: { moduleId: dbModule.id, order: lesson.order },
      });
      if (!existing) {
        await prisma.lesson.create({
          data: {
            moduleId: dbModule.id,
            title: lesson.title,
            order: lesson.order,
            duration: lesson.duration,
            type: "VIDEO",
            isFree: lesson.order === 1 && mod.order === 1,
          },
        });
      }
    }
  }

  // Curso: Aperfeiçoamento em Teste Respiratório Hidrogênio e Metano
  const modulesRespiratorio = [
    {
      title: "Teste Respiratório – Novos Protocolos",
      order: 1,
      lessons: [
        { title: "Introdução para prática de Teste Respiratório", order: 1, duration: 25 },
        { title: "Vivendo a experiência prática de exames", order: 2, duration: 45 },
        { title: "Interpretação de laudos realizados na prática", order: 3, duration: 40 },
        { title: "Desvendando novos Guidelines de Teste Respiratório", order: 4, duration: 50 },
        { title: "Casos clínicos desafiadores", order: 5, duration: 35 },
      ],
    },
  ];

  for (const mod of modulesRespiratorio) {
    const existingModule = await prisma.module.findFirst({
      where: { courseId: courseRespiratorio.id, order: mod.order },
    });
    const dbModule = existingModule ?? await prisma.module.create({
      data: { courseId: courseRespiratorio.id, title: mod.title, order: mod.order },
    });
    for (const lesson of mod.lessons) {
      const existing = await prisma.lesson.findFirst({
        where: { moduleId: dbModule.id, order: lesson.order },
      });
      if (!existing) {
        await prisma.lesson.create({
          data: {
            moduleId: dbModule.id,
            title: lesson.title,
            order: lesson.order,
            duration: lesson.duration,
            type: "VIDEO",
            isFree: lesson.order === 1 && mod.order === 1,
          },
        });
      }
    }
  }

  // Curso: Fisioterapia Respiratória
  const modulesFisioterapia = [
    {
      title: "Módulo 1: Fundamentos",
      order: 1,
      lessons: [
        { title: "Anatomia aplicada à fisioterapia respiratória", order: 1, duration: 20 },
        { title: "Avaliação do paciente respiratório", order: 2, duration: 16 },
        { title: "Técnicas de ausculta pulmonar", order: 3, duration: 18 },
      ],
    },
    {
      title: "Módulo 2: Técnicas Práticas",
      order: 2,
      lessons: [
        { title: "Higiene brônquica: tapotagem e vibração", order: 1, duration: 22 },
        { title: "Drenagem postural e flutter", order: 2, duration: 20 },
        { title: "Espirometria de incentivo e IPPB", order: 3, duration: 18 },
      ],
    },
    {
      title: "Módulo 3: Reabilitação Pulmonar",
      order: 3,
      lessons: [
        { title: "Protocolos em DPOC, asma e fibrose", order: 1, duration: 26 },
        { title: "Treino muscular respiratório", order: 2, duration: 22 },
        { title: "Alta hospitalar e plano domiciliar", order: 3, duration: 18 },
      ],
    },
  ];

  for (const mod of modulesFisioterapia) {
    const existingModule = await prisma.module.findFirst({
      where: { courseId: courseFisioterapia.id, order: mod.order },
    });
    const dbModule = existingModule ?? await prisma.module.create({
      data: { courseId: courseFisioterapia.id, title: mod.title, order: mod.order },
    });
    for (const lesson of mod.lessons) {
      const existing = await prisma.lesson.findFirst({
        where: { moduleId: dbModule.id, order: lesson.order },
      });
      if (!existing) {
        await prisma.lesson.create({
          data: {
            moduleId: dbModule.id,
            title: lesson.title,
            order: lesson.order,
            duration: lesson.duration,
            type: "VIDEO",
            isFree: lesson.order === 1 && mod.order === 1,
          },
        });
      }
    }
  }

  // Curso: Doenças da Cavidade Oral, Halimetria e Sialometria
  const modulesCavidadeOral = [
    {
      title: "Doenças da Cavidade Oral, Halimetria e Sialometria",
      order: 1,
      lessons: [
        { title: "Doenças da Cavidade Oral, Halimetria e Sialometria", order: 1, duration: 196, videoUrl: "https://www.youtube.com/embed/73mWEooXdHE", isFree: true },
      ],
    },
  ];

  for (const mod of modulesCavidadeOral) {
    const existingModule = await prisma.module.findFirst({
      where: { courseId: courseCavidadeOral.id, order: mod.order },
    });
    const dbModule = existingModule ?? await prisma.module.create({
      data: { courseId: courseCavidadeOral.id, title: mod.title, order: mod.order },
    });
    for (const lesson of mod.lessons) {
      const existing = await prisma.lesson.findFirst({
        where: { moduleId: dbModule.id, order: lesson.order },
      });
      if (!existing) {
        await prisma.lesson.create({
          data: {
            moduleId: dbModule.id,
            title: lesson.title,
            order: lesson.order,
            duration: lesson.duration,
            type: "VIDEO",
            videoUrl: lesson.videoUrl,
            isFree: lesson.order === 1 && mod.order === 1,
          },
        });
      }
    }
  }

  // Curso: Testes Respiratórios Presencial Junho 2026
  const modulesTestesPresencial = [
    {
      title: "Dia 1 (19/06): Módulo Teórico",
      order: 1,
      lessons: [
        { title: "Intolerâncias alimentares: lactose, frutose, frutanas e sacarose", order: 1, duration: 50 },
        { title: "SIBO, IMO, LIBO e SIFO: diagnóstico e critérios atualizados", order: 2, duration: 50 },
        { title: "Atualizações DDW 2025: novos protocolos e guidelines", order: 3, duration: 60 },
      ],
    },
    {
      title: "Dia 2 (20/06): Teoria + Prática Supervisionada",
      order: 2,
      lessons: [
        { title: "Como estruturar e implantar um serviço de testes respiratórios", order: 1, duration: 60 },
        { title: "Prática supervisionada: equipamento Dynamed", order: 2, duration: 60 },
        { title: "Prática supervisionada: equipamento Health Go", order: 3, duration: 60 },
        { title: "Elaboração e interpretação de laudos, casos reais", order: 4, duration: 70 },
      ],
    },
  ];

  for (const mod of modulesTestesPresencial) {
    const existingModule = await prisma.module.findFirst({
      where: { courseId: courseTestesPresencial.id, order: mod.order },
    });
    const dbModule = existingModule ?? await prisma.module.create({
      data: { courseId: courseTestesPresencial.id, title: mod.title, order: mod.order },
    });
    for (const lesson of mod.lessons) {
      const existing = await prisma.lesson.findFirst({
        where: { moduleId: dbModule.id, order: lesson.order },
      });
      if (!existing) {
        await prisma.lesson.create({
          data: {
            moduleId: dbModule.id,
            title: lesson.title,
            order: lesson.order,
            duration: lesson.duration,
            type: "VIDEO",
            isFree: lesson.order === 1 && mod.order === 1,
          },
        });
      }
    }
  }

  // Curso: Desvendando a Constipação Intestinal
  const modulesConstipacao = [
    {
      title: "Desvendando a Constipação Intestinal",
      order: 1,
      lessons: [
        { title: "Constipação intestinal: classificação Roma IV e abordagem clínica", order: 1, duration: 181, videoUrl: "https://www.youtube.com/embed/J5dI4R3xCws", isFree: true },
      ],
    },
  ];

  for (const mod of modulesConstipacao) {
    const existingModule = await prisma.module.findFirst({
      where: { courseId: courseConstipacao.id, order: mod.order },
    });
    const dbModule = existingModule ?? await prisma.module.create({
      data: { courseId: courseConstipacao.id, title: mod.title, order: mod.order },
    });
    for (const lesson of mod.lessons) {
      const existing = await prisma.lesson.findFirst({
        where: { moduleId: dbModule.id, order: lesson.order },
      });
      if (!existing) {
        await prisma.lesson.create({
          data: {
            moduleId: dbModule.id,
            title: lesson.title,
            order: lesson.order,
            duration: lesson.duration,
            type: "VIDEO",
            videoUrl: lesson.videoUrl,
            isFree: lesson.isFree,
          },
        });
      }
    }
  }

  console.log("✅ Seed concluído!");
  console.log(`   - 4 instrutores`);
  console.log(`   - 5 cursos publicados`);
  console.log(`   - Módulos e aulas para todos os cursos`);
  console.log(`   - Cupom NUVEM10 (10% de desconto)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
