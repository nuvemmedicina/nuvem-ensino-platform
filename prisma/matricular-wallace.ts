/**
 * Matrícula de cortesia do Wallace (Editor) no curso de DICI, para que ele
 * veja a plataforma pelo lado do aluno enquanto edita os cursos.
 *
 *   npx tsx prisma/matricular-wallace.ts
 *
 * Sem registro de Payment de propósito: cortesia não entra no faturamento.
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const EMAIL = "wallaceferreiras1@gmail.com";
const SLUG = "dici-neurogastroenterologia-2026";

async function main() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL }, select: { id: true, name: true, role: true } });
  if (!user) throw new Error(`Usuário não encontrado: ${EMAIL}`);

  const course = await prisma.course.findUnique({ where: { slug: SLUG }, select: { id: true, title: true } });
  if (!course) throw new Error(`Curso não encontrado: ${SLUG}`);

  const antes = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
    select: { id: true, status: true },
  });

  const matricula = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
    create: { userId: user.id, courseId: course.id, status: "ACTIVE" },
    update: { status: "ACTIVE" },
    select: { id: true, status: true, enrolledAt: true },
  });

  console.log(`${user.name} (${user.role})`);
  console.log(`Curso: ${course.title}`);
  console.log(antes ? `Matrícula já existia (${antes.status}) — agora ACTIVE` : "Matrícula criada");
  console.log(`  id: ${matricula.id}  status: ${matricula.status}  em: ${matricula.enrolledAt.toLocaleString("pt-BR")}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
