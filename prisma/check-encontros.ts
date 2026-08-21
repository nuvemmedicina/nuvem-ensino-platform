/** Encontros síncronos agendados + alunos ativos + histórico de e-mails. Só leitura. */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";
config({ path: ".env.local" });
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });
async function main() {
  const ls = await prisma.liveSession.findMany({
    orderBy: { startAt: "asc" },
    select: { title: true, startAt: true, endAt: true, meetUrl: true, location: true,
              reminder24h: true, reminder1h: true, course: { select: { title: true } } },
  });
  console.log(`ENCONTROS SÍNCRONOS AGENDADOS: ${ls.length}`);
  for (const s of ls) {
    console.log(`\n- ${s.title}`);
    console.log(`  curso: ${s.course.title.slice(0, 60)}`);
    console.log(`  início: ${s.startAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "full", timeStyle: "short" })}`);
    console.log(`  fim:    ${s.endAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", timeStyle: "short" })}`);
    console.log(`  link: ${s.meetUrl ?? "— SEM LINK —"} | local: ${s.location ?? "—"}`);
    console.log(`  lembrete 24h enviado: ${s.reminder24h} | 1h: ${s.reminder1h}`);
  }

  const dici = await prisma.course.findFirst({ where: { title: { contains: "Aperfeiçoamento em DICI" } }, select: { id: true, title: true } });
  if (dici) {
    const porStatus = await prisma.enrollment.groupBy({ by: ["status"], where: { courseId: dici.id }, _count: true });
    console.log(`\nMATRÍCULAS no DICI:`);
    porStatus.forEach((p) => console.log(`  ${p.status}: ${p._count}`));
  }

  console.log(`\nÚLTIMOS E-MAILS ENVIADOS:`);
  const logs = await prisma.emailLog.groupBy({ by: ["kind", "status"], _count: true, orderBy: { _count: { kind: "desc" } } });
  logs.forEach((l) => console.log(`  ${l.kind} | ${l.status}: ${l._count}`));
  const ultimo = await prisma.emailLog.findFirst({ orderBy: { createdAt: "desc" }, select: { kind: true, createdAt: true } });
  console.log(`  último envio: ${ultimo?.kind} em ${ultimo?.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
