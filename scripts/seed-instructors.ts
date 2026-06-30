import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const instructors = [
  {
    name: "Dra. Abadia Gilda Buso Matoso",
    email: "agbuso@yahoo.com.br",
    photoUrl: "/instructors/abadia-gilda-buso-matoso.jpeg",
    title: "Gastroenterologista",
    formation: "Mestre em Ciências da Saúde (UFU)",
    institution: "Professora da Faculdade de Medicina (UFU)",
  },
  {
    name: "Dra. Adelia Carmen Silva de Jesus",
    email: "adeliacarmensilvadejesus@gmail.com",
    photoUrl: "/instructors/adelia-carmen-silva-de-jesus.jpeg",
    title: "Gastroenterologista · Esp. em Endoscopia Digestiva (SOBED)",
    formation: "Esp. em Endoscopia Digestiva (SOBED)",
    institution: "Vice-Presidente da FGB – Gestão 2023/24",
  },
  {
    name: "Dr. Marcos Antonio Custódio Neto da Silva",
    email: "marcos.antonio@ufma.br",
    photoUrl: "/instructors/marcos-antonio-custodio-neto-da-silva.jpeg",
    title: "Gastroenterologista e Hepatologista",
    formation: "Doutor em Clínica Médica (UNICAMP)",
    institution: "Professor do Curso de Medicina da UFMA e UEMASUL",
  },
];

async function main() {
  for (const inst of instructors) {
    const existingUser = await prisma.user.findUnique({ where: { email: inst.email } });

    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
      await prisma.user.update({
        where: { id: userId },
        data: { name: inst.name, role: "INSTRUCTOR" },
      });
      console.log(`✓ Usuário já existia, atualizado: ${inst.email}`);
    } else {
      const user = await prisma.user.create({
        data: {
          name: inst.name,
          email: inst.email,
          role: "INSTRUCTOR",
          emailVerified: new Date(),
        },
      });
      userId = user.id;
      console.log(`✓ Usuário criado: ${inst.email}`);
    }

    const existingInstructor = await prisma.instructor.findUnique({ where: { userId } });
    if (existingInstructor) {
      console.log(`  → Perfil de instrutor já existia para ${inst.email}, pulando criação.`);
      continue;
    }

    const baseSlug = slugify(inst.name);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.instructor.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    await prisma.instructor.create({
      data: {
        userId,
        slug,
        title: inst.title,
        photoUrl: inst.photoUrl,
        formation: inst.formation,
        institution: inst.institution,
        displayOrder: 99,
      },
    });
    console.log(`  → Perfil de instrutor criado: ${slug}`);
  }

  await prisma.$disconnect();
}

main();
