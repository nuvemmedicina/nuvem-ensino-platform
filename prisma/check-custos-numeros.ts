/** Números para a planilha de custos: inscritos pagos, gratuitos e receita. Só leitura. */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const pagos = await prisma.payment.findMany({
    where: { status: "PAID" },
    select: { amount: true, method: true, enrollmentId: true, paidAt: true },
  });

  const receita = pagos.reduce((s, p) => s + Number(p.amount), 0);
  const enrollPagos = new Set(pagos.filter((p) => Number(p.amount) > 0).map((p) => p.enrollmentId));

  const totalMatriculas = await prisma.enrollment.count();
  const ativas = await prisma.enrollment.count({ where: { status: "ACTIVE" } });

  console.log("=== GERAL ===");
  console.log(`matrículas (todas): ${totalMatriculas} | ativas: ${ativas}`);
  console.log(`pagamentos PAID: ${pagos.length} | receita total: R$ ${receita.toFixed(2)}`);
  console.log(`matrículas com pagamento > 0: ${enrollPagos.size}`);
  console.log(`matrículas gratuitas/sem pagamento: ${totalMatriculas - enrollPagos.size}`);

  console.log("\n=== POR MÉTODO ===");
  const porMetodo = new Map<string, { n: number; v: number }>();
  for (const p of pagos) {
    const k = p.method;
    const cur = porMetodo.get(k) ?? { n: 0, v: 0 };
    cur.n++; cur.v += Number(p.amount);
    porMetodo.set(k, cur);
  }
  for (const [k, v] of porMetodo) console.log(`${k}: ${v.n} pagto(s) — R$ ${v.v.toFixed(2)}`);

  console.log("\n=== POR CURSO ===");
  const cursos = await prisma.course.findMany({
    select: {
      title: true, slug: true, price: true, salePrice: true, status: true,
      enrollments: {
        select: { id: true, status: true, payments: { select: { amount: true, status: true } } },
      },
    },
    orderBy: { title: "asc" },
  });
  for (const c of cursos) {
    if (c.enrollments.length === 0) continue;
    let pg = 0, gr = 0, rec = 0;
    for (const e of c.enrollments) {
      const v = e.payments.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.amount), 0);
      if (v > 0) { pg++; rec += v; } else gr++;
    }
    console.log(`${c.title} [${c.status}] preço R$ ${c.price}${c.salePrice ? ` (promo R$ ${c.salePrice})` : ""}`);
    console.log(`   matrículas: ${c.enrollments.length} | pagas: ${pg} | gratuitas: ${gr} | receita: R$ ${rec.toFixed(2)}`);
  }

  console.log("\n=== CERTIFICADOS EMITIDOS ===");
  console.log(`total: ${await prisma.certificate.count()}`);

  console.log("\n=== USUÁRIOS ===");
  const porPapel = await prisma.user.groupBy({ by: ["role"], _count: { _all: true } });
  for (const r of porPapel) console.log(`${r.role}: ${r._count._all}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
