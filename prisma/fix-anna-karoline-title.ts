import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const updated = await prisma.instructor.updateMany({
    where: { slug: "dra-anna-karoline" },
    data: {
      title: "Fisioterapeuta Pélvica",
      crm: "CREFITO 4/270579-F",
    },
  });
  console.log(`Updated ${updated.count} instructor(s)`);

  const inst = await prisma.instructor.findFirst({
    where: { slug: "dra-anna-karoline" },
    include: { user: true },
  });
  console.log("name:", inst?.user.name);
  console.log("title:", inst?.title);
  console.log("crm:", inst?.crm);
}

main().catch(console.error).finally(() => prisma.$disconnect());
