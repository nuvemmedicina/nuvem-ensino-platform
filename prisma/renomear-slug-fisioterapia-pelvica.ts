import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import "dotenv/config";

// O curso de fisioterapia pélvica foi criado com o slug "fisioterapia-respiratoria".
// Uso: npx tsx prisma/renomear-slug-fisioterapia-pelvica.ts [--aplicar]
const ANTIGO = "fisioterapia-respiratoria";
const NOVO = "fisioterapia-pelvica";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const curso = await prisma.course.findUnique({
    where: { slug: ANTIGO },
    select: { id: true, title: true, status: true, _count: { select: { enrollments: true, modules: true } } },
  });
  const conflito = await prisma.course.findUnique({ where: { slug: NOVO }, select: { id: true } });
  console.log({ curso, conflito });
  if (!curso) throw new Error("Curso com slug antigo não encontrado");
  if (conflito) throw new Error("Já existe curso com o slug novo");

  if (process.argv.includes("--aplicar")) {
    await prisma.course.update({ where: { slug: ANTIGO }, data: { slug: NOVO } });
    console.log(`Slug alterado: ${ANTIGO} -> ${NOVO}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
