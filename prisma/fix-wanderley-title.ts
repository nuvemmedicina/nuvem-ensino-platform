import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import "dotenv/config";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const updated = await prisma.instructor.updateMany({
    where: { slug: "dr-wanderley-bertoni" },
    data: {
      title: "Gastroenterologista · Prof. FAMINAS-Muriaé · Titular SOBED",
    },
  });
  console.log(`Updated ${updated.count} instructor(s)`);

  const inst = await prisma.instructor.findFirst({
    where: { slug: "dr-wanderley-bertoni" },
  });
  console.log("title:", inst?.title);
}

main().catch(console.error).finally(() => prisma.$disconnect());
