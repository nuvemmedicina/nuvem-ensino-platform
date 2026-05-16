import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import "dotenv/config";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const course = await prisma.course.findFirst({
    where: { slug: "testes-respiratorios" },
    include: { tags: { include: { tag: true } } },
  });
  if (!course) throw new Error("Course not found");
  console.log("Current tags:", course.tags.map((t) => t.tag.name));

  // Remove all current tags
  await prisma.courseTag.deleteMany({ where: { courseId: course.id } });

  // Add Gastroenterologia tag
  const gastro = await prisma.tag.upsert({
    where: { slug: "gastroenterologia" },
    update: {},
    create: { name: "Gastroenterologia", slug: "gastroenterologia" },
  });

  await prisma.courseTag.create({
    data: { courseId: course.id, tagId: gastro.id },
  });

  console.log("Updated: tag now Gastroenterologia");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
