/**
 * Exporta a turma do DICI para o relatório de pagamentos e acesso. Só leitura.
 *
 *   npx tsx prisma/export-turma-dici.ts saida.json
 *
 * Exclui contas de instrutor: a lista é da turma, não do corpo docente.
 *
 * O cupom vem de Payment.couponId quando existe. Pagamentos anteriores a
 * julho/2026 não gravavam esse campo, então nesses casos o cupom é DEDUZIDO
 * pelo desconto sobre o preço cheio e marcado com `inferido: true` — o
 * relatório precisa distinguir os dois, senão um número deduzido passa por
 * confirmado.
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";
import { writeFileSync } from "fs";

config({ path: ".env.local" });

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const saida = process.argv[2];
  if (!saida) { console.error("Informe o arquivo de saída."); process.exitCode = 1; return; }

  const curso = await prisma.course.findFirst({
    where: { title: { contains: "Aperfeiçoamento em DICI" } },
    select: { id: true, title: true, price: true, startDate: true },
  });
  if (!curso) { console.error("Curso DICI não encontrado."); process.exitCode = 1; return; }

  const cheio = Number(curso.price);

  const cupons = await prisma.coupon.findMany({
    select: { id: true, code: true, discountPct: true, discountFlat: true },
  });
  const porId = new Map(cupons.map((c) => [c.id, c]));

  /** Valor final que cada cupom produz sobre o preço cheio. Usado para deduzir. */
  const valorDoCupom = (c: (typeof cupons)[number]) =>
    c.discountPct != null ? +(cheio * (1 - c.discountPct / 100)).toFixed(2)
    : c.discountFlat != null ? +(cheio - Number(c.discountFlat)).toFixed(2)
    : null;

  const matriculas = await prisma.enrollment.findMany({
    where: { courseId: curso.id, user: { instructor: null } },
    select: {
      status: true, enrolledAt: true,
      user: {
        select: {
          name: true, email: true, passwordHash: true,
          accounts: { select: { provider: true } },
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        select: { status: true, amount: true, method: true, couponId: true, paidAt: true },
      },
      progress: { where: { completed: true }, select: { id: true } },
    },
  });

  const linhas = matriculas.map((m) => {
    const pago = m.payments.find((p) => p.status === "PAID");
    const reembolso = m.payments.find((p) => p.status === "REFUNDED");
    const valor = pago ? Number(pago.amount) : reembolso ? Number(reembolso.amount) : null;

    // cupom: gravado > deduzido pelo valor
    let cupom: string | null = null;
    let cupomInferido = false;
    const gravado = pago?.couponId ?? reembolso?.couponId ?? null;
    if (gravado && porId.has(gravado)) {
      cupom = porId.get(gravado)!.code;
    } else if (valor != null && valor > 0 && Math.abs(valor - cheio) > 0.01) {
      const achado = cupons.find((c) => {
        const v = valorDoCupom(c);
        return v != null && Math.abs(v - valor) < 0.01;
      });
      if (achado) { cupom = achado.code; cupomInferido = true; }
    } else if (valor != null && valor === 0 && m.payments.length > 0) {
      const cem = cupons.find((c) => c.discountPct === 100);
      if (cem && gravado === cem.id) cupom = cem.code;
    }

    const temSenha = !!m.user.passwordHash;
    const social = m.user.accounts.map((a) => a.provider);
    const aulas = m.progress.length;
    const podeEntrar = temSenha || social.length > 0;

    const encerrada = m.status === "CANCELLED" || m.status === "REFUNDED";

    return {
      nome: m.user.name?.replace(/\s+/g, " ").trim() ?? "—",
      email: m.user.email,
      status: m.status,
      situacao:
        m.status === "CANCELLED" ? "Cancelada"
        : m.status === "REFUNDED" ? "Reembolsada"
        : m.status === "PENDING" ? "Pendente"
        : valor != null && valor > 0 ? "Paga"
        : "Cortesia",
      data: m.enrolledAt.toISOString(),
      valor,
      cupom, cupomInferido,
      metodo: pago?.method ?? reembolso?.method ?? null,
      acesso: encerrada ? "na" : aulas > 0 ? "estudou" : podeEntrar ? "pode" : "sem",
      aulas,
      entraPor: social.includes("google") ? "Google" : temSenha ? "Senha" : "—",
    };
  });

  linhas.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  writeFileSync(saida, JSON.stringify({
    curso: curso.title, precoCheio: cheio,
    inicio: curso.startDate?.toISOString() ?? null,
    geradoEm: new Date().toISOString(),
    linhas,
  }, null, 2), "utf8");

  const c = (f: (l: (typeof linhas)[number]) => boolean) => linhas.filter(f).length;
  console.log(`Matrículas (sem instrutores): ${linhas.length}`);
  console.log(`  pagas ${c((l) => l.situacao === "Paga")} | cortesia ${c((l) => l.situacao === "Cortesia")} | canceladas ${c((l) => l.situacao === "Cancelada")} | reembolsadas ${c((l) => l.situacao === "Reembolsada")} | pendentes ${c((l) => l.situacao === "Pendente")}`);
  console.log(`  acesso: estudou ${c((l) => l.acesso === "estudou")} | pode entrar ${c((l) => l.acesso === "pode")} | sem acesso ${c((l) => l.acesso === "sem")}`);
  const receita = linhas.filter((l) => l.situacao === "Paga").reduce((s, l) => s + (l.valor ?? 0), 0);
  console.log(`  receita: R$ ${receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
  console.log(`  cupons deduzidos (não gravados): ${c((l) => l.cupomInferido)}`);
  console.log(`\nArquivo: ${saida}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
