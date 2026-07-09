import { prisma } from "../lib/prisma";
import { randomUUID } from "crypto";

const EMAIL = "anapgs.mkt@gmail.com";
const SLUG  = "dici-neurogastroenterologia-2026";

async function main() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) { console.error("Usuário não encontrado"); process.exit(1); }

  const course = await prisma.course.findUnique({ where: { slug: SLUG } });
  if (!course) { console.error("Curso não encontrado"); process.exit(1); }

  const existing = await prisma.enrollment.findFirst({
    where: { userId: user.id, courseId: course.id },
  });

  if (existing) {
    await prisma.enrollment.update({ where: { id: existing.id }, data: { status: "ACTIVE" } });
    console.log("✓ Matrícula reativada:", existing.id);
  } else {
    const e = await prisma.enrollment.create({
      data: { id: randomUUID(), userId: user.id, courseId: course.id, status: "ACTIVE" },
    });
    console.log("✓ Matrícula criada:", e.id);
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
