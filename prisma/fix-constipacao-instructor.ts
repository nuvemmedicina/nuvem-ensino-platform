import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import "dotenv/config";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const eliane = await prisma.instructor.findFirst({
    where: { slug: "dra-eliane-basques" },
    select: { id: true },
  });
  if (!eliane) throw new Error("Instructor dra-eliane-basques not found");

  const updated = await prisma.course.updateMany({
    where: { slug: "desvendando-a-constipacao-intestinal" },
    data: { instructorId: eliane.id },
  });
  console.log(`Updated ${updated.count} course(s) — instructorId: ${eliane.id}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
