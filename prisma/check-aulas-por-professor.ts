/** Conta aulas por professor, para o relatório de pagamento. Só leitura. */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const instrutores = await prisma.instructor.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      user: { select: { name: true, email: true } },
      lessonInstructors: {
        select: {
          lesson: {
            select: {
              id: true,
              title: true,
              type: true,
              module: { select: { title: true, course: { select: { title: true } } } },
            },
          },
        },
      },
      modules: { select: { module: { select: { title: true } } } },
    },
  });

  console.log("=".repeat(80));
  console.log("AULAS VINCULADAS A CADA PROFESSOR (LessonInstructor)");
  console.log("=".repeat(80));
  for (const i of instrutores.sort((a, b) => b.lessonInstructors.length - a.lessonInstructors.length)) {
    console.log(`\n### ${i.title ?? ""} ${i.user.name}  <${i.user.email}>`);
    console.log(`    aulas: ${i.lessonInstructors.length} | módulos vinculados: ${i.modules.length}`);
    const porCurso = new Map<string, string[]>();
    for (const li of i.lessonInstructors) {
      const curso = li.lesson.module.course.title;
      if (!porCurso.has(curso)) porCurso.set(curso, []);
      porCurso.get(curso)!.push(`[${li.lesson.type}] ${li.lesson.module.title} → ${li.lesson.title}`);
    }
    for (const [curso, aulas] of porCurso) {
      console.log(`    ${curso}: ${aulas.length}`);
      aulas.forEach((a) => console.log(`       - ${a}`));
    }
  }

  const totalAulas = await prisma.lesson.count();
  const semInstrutor = await prisma.lesson.count({ where: { instructors: { none: {} } } });
  console.log("\n" + "=".repeat(80));
  console.log(`TOTAL de aulas na plataforma: ${totalAulas}`);
  console.log(`Aulas SEM professor vinculado: ${semInstrutor}`);

  console.log("\nPor tipo:");
  const porTipo = await prisma.lesson.groupBy({ by: ["type"], _count: true });
  porTipo.forEach((t) => console.log(`  ${t.type}: ${t._count}`));

  console.log("\nAulas sem professor vinculado (amostra por curso):");
  const orfas = await prisma.lesson.findMany({
    where: { instructors: { none: {} } },
    select: { title: true, type: true, module: { select: { title: true, course: { select: { title: true } } } } },
  });
  const porCursoOrfa = new Map<string, number>();
  for (const o of orfas) {
    const c = o.module.course.title;
    porCursoOrfa.set(c, (porCursoOrfa.get(c) ?? 0) + 1);
  }
  for (const [c, n] of [...porCursoOrfa].sort((a, b) => b[1] - a[1])) console.log(`  ${c}: ${n}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
