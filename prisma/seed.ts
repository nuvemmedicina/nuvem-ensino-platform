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
      location: "Nuvem Medicina · Belo Horizonte — MG",
      metaTitle: "Manometria, pHmetria e Impedância | Nuvem Ensino",
      metaDesc:
        "Curso hands-on de manometria esofágica de alta resolução, pHmetria e impedancio-pHmetria com Dr. Felipe Nelson.",
    },
  });

  const courseAnorretal = await prisma.course.upsert({
    where: { slug: "manometria-anorretal" },
    update: {},
    create: {
      slug: "manometria-anorretal",
      title: "Manometria Anorretal",
      description:
        "Técnicas avançadas de manometria anorretal de alta resolução com interpretação clínica aplicada ao diagnóstico de distúrbios funcionais.",
      shortDesc: "Técnicas de manometria anorretal de alta resolução com interpretação clínica.",
      price: 4500,
      hours: 12,
      category: "HANDS_ON",
      status: "PUBLISHED",
      instructorId: instructorEliane.id,
      totalSeats: 10,
      reservedSeats: 4,
      thumbnailUrl: "/instructors/dra-eliane.jpg",
      location: "Nuvem Medicina · Belo Horizonte — MG",
      metaTitle: "Manometria Anorretal | Nuvem Ensino",
      metaDesc:
        "Curso hands-on de manometria anorretal de alta resolução com Dra. Eliane Basques.",
    },
  });

  const courseRespiratorio = await prisma.course.upsert({
    where: { slug: "testes-respiratorios" },
    update: {},
    create: {
      slug: "testes-respiratorios",
      title: "Testes Respiratórios",
      description:
        "Espirometria, manovacuometria e curva fluxo-volume com interpretação avançada em módulo online ao vivo.",
      shortDesc: "Interpretação avançada de espirometria e manovacuometria em formato online.",
      price: 2200,
      hours: 8,
      category: "ONLINE",
      status: "PUBLISHED",
      instructorId: instructorVera.id,
      thumbnailUrl: "/instructors/dra-vera.jpg",
      metaTitle: "Testes Respiratórios | Nuvem Ensino",
      metaDesc:
        "Curso online de espirometria, manovacuometria e curva fluxo-volume com Dra. Vera Ângelo.",
    },
  });

  const courseFisioterapia = await prisma.course.upsert({
    where: { slug: "fisioterapia-respiratoria" },
    update: {},
    create: {
      slug: "fisioterapia-respiratoria",
      title: "Fisioterapia Respiratória",
      description:
        "Técnicas de reabilitação pulmonar e manejo de pacientes críticos com foco em prática clínica.",
      shortDesc: "Técnicas de reabilitação pulmonar e manejo clínico em ambiente supervisionado.",
      price: 3500,
      hours: 12,
      category: "HANDS_ON",
      status: "PUBLISHED",
      instructorId: instructorAnna.id,
      totalSeats: 14,
      reservedSeats: 4,
      thumbnailUrl: "/instructors/anna-karoline.jpg",
      location: "Nuvem Medicina · Belo Horizonte — MG",
      metaTitle: "Fisioterapia Respiratória | Nuvem Ensino",
      metaDesc:
        "Curso hands-on de fisioterapia respiratória e reabilitação pulmonar com Dra. Anna Karoline.",
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

  console.log("✅ Seed concluído!");
  console.log(`   - 4 instrutores`);
  console.log(`   - 4 cursos publicados`);
  console.log(`   - Cupom NUVEM10 (10% de desconto)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
