import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const INSTRUCTORS = [
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
  {
    name: "Dr. Moisés Copelman",
    email: "mcopelman@yahoo.com.br",
    photoUrl: null,
    title: "Gastroenterologista",
    formation: "Mestre em Gastroenterologia (USP)",
    institution: "Responsável pela Endoscopia Pediátrica (UERJ e HFB/MS)",
  },
];

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const results: string[] = [];

  for (const inst of INSTRUCTORS) {
    try {
      const existingUser = await prisma.user.findUnique({ where: { email: inst.email } });

      let userId: string;
      if (existingUser) {
        userId = existingUser.id;
        await prisma.user.update({
          where: { id: userId },
          data: { name: inst.name, role: "INSTRUCTOR" },
        });
        results.push(`✓ Usuário já existia, atualizado: ${inst.email}`);
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
        results.push(`✓ Usuário criado: ${inst.email}`);
      }

      const existingInstructor = await prisma.instructor.findUnique({ where: { userId } });
      if (existingInstructor) {
        results.push(`  → Perfil já existia para ${inst.email}`);
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
      results.push(`  → Perfil criado: ${slug}`);
    } catch (e) {
      results.push(`✗ Erro em ${inst.email}: ${String(e)}`);
    }
  }

  return NextResponse.json({ ok: true, results });
}
