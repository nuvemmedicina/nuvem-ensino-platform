import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import "dotenv/config";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const newPhoto = "/instructors/wanderley-bertoni.jpg";

  await prisma.instructor.updateMany({
    where: { slug: "dr-wanderley-bertoni" },
    data: { photoUrl: newPhoto },
  });

  await prisma.user.updateMany({
    where: { email: "wanderley.bertoni@nuvemensino.com.br" },
    data: { image: newPhoto },
  });

  await prisma.course.updateMany({
    where: { slug: "doencas-da-cavidade-oral-halimetria-e-sialometria" },
    data: { thumbnailUrl: newPhoto },
  });

  console.log("Updated photo to", newPhoto);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
