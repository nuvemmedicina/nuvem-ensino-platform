import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import "dotenv/config";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const updated = await prisma.instructor.updateMany({
    where: { slug: "dr-wanderley-bertoni" },
    data: {
      crm: "CRM-MG 26967",
      rqe: "RQE 24610/38052",
    },
  });
  console.log(`Updated ${updated.count} instructor(s)`);

  const inst = await prisma.instructor.findFirst({
    where: { slug: "dr-wanderley-bertoni" },
    include: { user: true },
  });
  console.log("name:", inst?.user.name);
  console.log("crm:", inst?.crm);
  console.log("rqe:", inst?.rqe);
}

main().catch(console.error).finally(() => prisma.$disconnect());
