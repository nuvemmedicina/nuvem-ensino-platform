/** Mostra os grupos de flashcards e o conteúdo dos cards. Só leitura. */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APP = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.nuvemensino.com.br").replace(/\/$/, "");

async function main() {
  const grupos = await prisma.flashcardGroup.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, description: true, createdAt: true,
      course: { select: { title: true } },
      cards: { orderBy: { order: "asc" }, select: { front: true, back: true } },
    },
  });

  console.log(`GRUPOS DE FLASHCARDS: ${grupos.length}\n`);
  for (const g of grupos) {
    console.log("=".repeat(76));
    console.log(`${g.title}   (${g.cards.length} cards)`);
    console.log(`curso: ${g.course?.title.slice(0, 50) ?? "—"}`);
    console.log(`criado: ${g.createdAt.toLocaleString("pt-BR")}`);
    console.log(`link:  ${APP}/dashboard/flashcards/${g.id}`);
    console.log("=".repeat(76));
    g.cards.forEach((c, i) => {
      console.log(`\n[${i + 1}] ${c.front}`);
      console.log(`    ${c.back}`);
    });
    console.log();
  }
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
