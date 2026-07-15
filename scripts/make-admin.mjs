import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const emails = [
  "anapgs.mkt@gmail.com",
  "nuvem.ensino@gmail.com",
  "rafaelleao2001@gmail.com",
];

for (const email of emails) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const updated = await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
    console.log(`✅ Promovido a ADMIN: ${updated.name ?? updated.email}`);
  } else {
    console.log(`⚠️  Usuário não encontrado: ${email}`);
  }
}

await prisma.$disconnect();
