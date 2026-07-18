import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import "dotenv/config";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const emails = ["anapgs.mkt@gmail.com", "nuvem.ensino@gmail.com", "rafaelleao2001@gmail.com"];

for (const email of emails) {
  const u = await prisma.user.findUnique({ where: { email } });
  if (!u) { console.log(email, "-> nao encontrado"); continue; }
  await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
  console.log(email, "-> ADMIN ok");
}
await prisma.$disconnect();
