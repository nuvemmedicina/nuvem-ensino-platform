/** Cronograma do curso DICI: datas, módulos, liberação e encontros síncronos. Só leitura. */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";
config({ path: ".env.local" });
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

const fmt = (d: Date | null) =>
  d ? d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "full", timeStyle: "short" }) : "—";

async function main() {
  const c = await prisma.course.findUnique({
    where: { slug: "dici-neurogastroenterologia-2026" },
    select: {
      title: true, price: true, salePrice: true, hours: true,
      startDate: true, endDate: true, startDateLabel: true,
      totalSeats: true, reservedSeats: true, shortDesc: true,
      objectives: true, includes: true, targetAudience: true,
      modules: {
        orderBy: { order: "asc" },
        select: {
          title: true, description: true, releaseDate: true,
          topics: { orderBy: { order: "asc" }, select: { title: true } },
          _count: { select: { lessons: true } },
        },
      },
    },
  });
  if (!c) return console.log("curso não encontrado");

  console.log(`=== ${c.title} ===`);
  console.log(`carga horária: ${c.hours}h | preço: R$ ${c.price}${c.salePrice ? ` | promo: R$ ${c.salePrice}` : ""}`);
  console.log(`início: ${fmt(c.startDate)}`);
  console.log(`fim:    ${fmt(c.endDate)}`);
  console.log(`rótulo de data: ${c.startDateLabel ?? "—"}`);
  console.log(`vagas: ${c.totalSeats ?? "—"} | reservadas: ${c.reservedSeats}`);
  console.log(`\nresumo: ${c.shortDesc ?? "—"}`);
  console.log(`\nO QUE ESTÁ INCLUÍDO:\n${c.includes ?? "—"}`);
  console.log(`\nOBJETIVOS:\n${c.objectives ?? "—"}`);
  console.log(`\nPÚBLICO-ALVO:\n${c.targetAudience ?? "—"}`);

  console.log(`\n=== MÓDULOS ===`);
  for (const m of c.modules) {
    console.log(`\n• ${m.title}`);
    console.log(`  aulas: ${m._count.lessons} | liberação: ${m.releaseDate ? fmt(m.releaseDate) : "imediata"}`);
    if (m.description) console.log(`  ${m.description}`);
    for (const t of m.topics) console.log(`    – ${t.title}`);
  }

  console.log(`\n=== ENCONTROS SÍNCRONOS ===`);
  const ls = await prisma.liveSession.findMany({
    where: { course: { slug: "dici-neurogastroenterologia-2026" } },
    orderBy: { startAt: "asc" },
    select: { title: true, startAt: true, endAt: true, description: true },
  });
  if (ls.length === 0) console.log("nenhum encontro cadastrado");
  for (const s of ls) {
    console.log(`- ${s.title}`);
    console.log(`  ${fmt(s.startAt)} até ${s.endAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", timeStyle: "short" })}`);
    if (s.description) console.log(`  ${s.description}`);
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
