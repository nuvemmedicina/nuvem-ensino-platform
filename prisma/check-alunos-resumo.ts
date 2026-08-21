/**
 * Números de alunos para relatório gerencial. Só leitura.
 *
 * Critério de "pagante": existe Payment PAID com valor > 0. A checagem do valor
 * é essencial — 11 matrículas de cortesia estão gravadas como PAID/FREE/R$ 0
 * (professores e convidados) e sem isso entram na conta como se tivessem pago.
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";
config({ path: ".env.local" });
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

(async () => {
  const ativas = await prisma.enrollment.findMany({
    where: { status: { in: ["ACTIVE", "COMPLETED"] } },
    select: {
      userId: true,
      user: { select: { name: true, instructor: { select: { id: true } } } },
      course: { select: { title: true, status: true } },
      payments: { select: { status: true, amount: true, method: true } },
    },
  });

  const valorPago = (e: (typeof ativas)[number]) =>
    e.payments.filter((p) => p.status === "PAID").reduce((a, p) => a + Number(p.amount), 0);
  const pagante = (e: (typeof ativas)[number]) => valorPago(e) > 0;
  const cortesia = (e: (typeof ativas)[number]) =>
    !pagante(e) && (e.payments.length === 0 || e.payments.every((p) => p.method === "FREE"));
  const pendente = (e: (typeof ativas)[number]) => !pagante(e) && !cortesia(e);

  const pagantes = ativas.filter(pagante);
  const cortesias = ativas.filter(cortesia);
  const pendentes = ativas.filter(pendente);
  const receita = ativas.reduce((s, e) => s + valorPago(e), 0);

  const deProfessor = ativas.filter((e) => e.user.instructor);
  const pessoas = new Set(ativas.map((e) => e.userId));
  const pessoasSemProf = new Set(ativas.filter((e) => !e.user.instructor).map((e) => e.userId));

  console.log("MATRÍCULAS VÁLIDAS (ACTIVE + COMPLETED)");
  console.log(`  total ................. ${ativas.length}`);
  console.log(`  pagantes (R$ > 0) ..... ${pagantes.length}`);
  console.log(`  cortesia / gratuitas .. ${cortesias.length}`);
  console.log(`  pagamento pendente .... ${pendentes.length}`);
  console.log(`  receita ............... R$ ${receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
  console.log(`\n  dessas, de professores  ${deProfessor.length}  (acesso ao próprio curso)`);
  console.log(`\nPESSOAS ÚNICAS`);
  console.log(`  com professores ....... ${pessoas.size}`);
  console.log(`  só alunos ............. ${pessoasSemProf.size}`);

  console.log(`\nPOR CURSO`);
  const m = new Map<string, { st: string; t: number; p: number; c: number; d: number; r: number }>();
  for (const e of ativas) {
    const k = e.course.title;
    if (!m.has(k)) m.set(k, { st: e.course.status, t: 0, p: 0, c: 0, d: 0, r: 0 });
    const x = m.get(k)!;
    x.t++; x.r += valorPago(e);
    if (pagante(e)) x.p++; else if (cortesia(e)) x.c++; else x.d++;
  }
  console.log(`tot | pag | cort | pend | receita        | curso`);
  for (const [t, c] of [...m].sort((a, b) => b[1].t - a[1].t))
    console.log(`${String(c.t).padStart(3)} | ${String(c.p).padStart(3)} | ${String(c.c).padStart(4)} | ${String(c.d).padStart(4)} | ${("R$ " + c.r.toLocaleString("pt-BR", { minimumFractionDigits: 2 })).padStart(14)} | [${c.st === "PUBLISHED" ? "pub" : "arq"}] ${t.slice(0, 45)}`);
})().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
