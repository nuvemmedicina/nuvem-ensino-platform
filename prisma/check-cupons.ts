/** Lista os cupons cadastrados e o preço dos cursos publicados. Só leitura.
 *  uso: npx tsx prisma/check-cupons.ts
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const cupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  console.log(`CUPONS (${cupons.length}):`);
  for (const c of cupons) {
    const desconto = c.discountPct ? `${c.discountPct}%` : `R$ ${c.discountFlat}`;
    const validade = c.expiresAt ? c.expiresAt.toLocaleString("pt-BR") : "sem prazo";
    const usos = `${c.usesCount}${c.maxUses ? `/${c.maxUses}` : ""}`;
    console.log(`  ${c.code.padEnd(20)} | ${desconto.padEnd(10)} | ${c.active ? "ATIVO " : "inativo"} | expira: ${validade.padEnd(22)} | usos: ${usos}`);
  }

  const cursos = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    select: { title: true, slug: true, price: true, status: true },
    orderBy: { createdAt: "desc" },
  });
  console.log(`\nCURSOS PUBLICADOS (${cursos.length}):`);
  for (const c of cursos) console.log(`  R$ ${String(c.price).padEnd(10)} | ${c.slug}\n     ${c.title}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
