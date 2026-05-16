import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import "dotenv/config";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const wanderley = await prisma.instructor.findFirst({
    where: { slug: "dr-wanderley-bertoni" },
    select: { id: true },
  });
  if (!wanderley) throw new Error("Instructor dr-wanderley-bertoni not found");

  const updated = await prisma.course.updateMany({
    where: { slug: "doencas-da-cavidade-oral-halimetria-e-sialometria" },
    data: { instructorId: wanderley.id },
  });
  console.log(`Updated ${updated.count} course(s) — instructorId: ${wanderley.id}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
