import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import "dotenv/config";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const course = await prisma.course.findFirst({
    where: { slug: "doencas-da-cavidade-oral-halimetria-e-sialometria" },
    select: { thumbnailUrl: true },
  });
  console.log("thumbnailUrl:", course?.thumbnailUrl);
}

main().catch(console.error).finally(() => prisma.$disconnect());
