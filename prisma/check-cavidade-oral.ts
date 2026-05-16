import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import "dotenv/config";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const course = await prisma.course.findFirst({
    where: { slug: "doencas-da-cavidade-oral-halimetria-e-sialometria" },
    include: {
      instructor: { include: { user: true } },
    },
  });
  if (!course) throw new Error("Course not found");
  console.log("thumbnailUrl:", course.thumbnailUrl);
  console.log("instructor name:", course.instructor.user.name);
  console.log("instructor slug:", course.instructor.slug);
  console.log("instructor photoUrl:", course.instructor.photoUrl);
  console.log("instructor title:", course.instructor.title);
  console.log("instructor crm:", course.instructor.crm);
}

main().catch(console.error).finally(() => prisma.$disconnect());
