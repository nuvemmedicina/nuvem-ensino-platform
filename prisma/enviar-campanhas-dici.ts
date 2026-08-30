/**
 * Duas campanhas do curso DICI:
 *   1. reengajamento com cupom — quem tentou pagar e não concluiu
 *   2. lembrete de aulas — quem tem acesso e nunca assistiu nada
 *
 *   npx tsx prisma/enviar-campanhas-dici.ts              # simulação
 *   npx tsx prisma/enviar-campanhas-dici.ts --enviar 1   # dispara só a campanha 1
 *   npx tsx prisma/enviar-campanhas-dici.ts --enviar 2   # dispara só a campanha 2
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

const SLUG = "dici-neurogastroenterologia-2026";
const CUPOM = "NUVEMESPECIAL20";
const PAUSA_MS = 600;
const EMAIL_OK = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

// A segunda conta da Dra. Vera é da equipe, não de aluna — fica fora do lembrete.
const EXCLUIR = new Set(["veraluciaangeloandrade@gmail.com"]);

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const primeiroNome = (n: string | null) => (n ?? "").replace(/\s+/g, " ").trim() || "Aluno";

async function main() {
  const enviar = process.argv.includes("--enviar");
  const qual = process.argv[process.argv.indexOf("--enviar") + 1];

  const { sendCupomReengajamento, sendLembreteAulas } = await import("@/lib/email");

  const curso = await prisma.course.findUniqueOrThrow({
    where: { slug: SLUG },
    select: { id: true, title: true, price: true },
  });
  const cheio = Number(curso.price);
  const comDesc = cheio * 0.8;

  const es = await prisma.enrollment.findMany({
    where: { courseId: curso.id, user: { instructor: { is: null } } },
    include: {
      user: { select: { name: true, email: true, passwordHash: true, accounts: { select: { provider: true } } } },
      payments: true,
      progress: { where: { completed: true }, select: { id: true } },
    },
  });

  const valido = (e: (typeof es)[0]) => EMAIL_OK.test(e.user.email) && !EXCLUIR.has(e.user.email);

  const grupo1 = es.filter((e) => {
    if (e.payments.some((p) => p.status === "PAID" && Number(p.amount) > 0)) return false;
    return e.status === "CANCELLED" || e.payments.some((p) => ["FAILED", "PENDING"].includes(p.status));
  }).filter(valido);

  const grupo2 = es.filter((e) => {
    const pago = e.payments.some((p) => p.status === "PAID");
    const cred = !!e.user.passwordHash || e.user.accounts.length > 0;
    return e.status !== "CANCELLED" && pago && cred && e.progress.length === 0;
  }).filter(valido);

  console.log(`CAMPANHA 1 — reengajamento com ${CUPOM}: ${grupo1.length} destinatários`);
  console.log(`   ${brl(cheio)} -> ${brl(comDesc)} (economia de ${brl(cheio - comDesc)})`);
  grupo1.forEach((e) => console.log(`   .  ${primeiroNome(e.user.name)} <${e.user.email}>`));

  console.log(`\nCAMPANHA 2 — lembrete de aulas: ${grupo2.length} destinatários`);
  grupo2.forEach((e) => console.log(`   .  ${primeiroNome(e.user.name)} <${e.user.email}>`));

  const excluidos = es.filter((e) => EXCLUIR.has(e.user.email)).length;
  if (excluidos) console.log(`\n(${excluidos} conta(s) da equipe excluída(s) das duas listas)`);

  if (!enviar) {
    console.log(`\n[SIMULAÇÃO] Nada saiu. Use --enviar 1 ou --enviar 2.`);
    return;
  }

  const alvo = qual === "1" ? grupo1 : qual === "2" ? grupo2 : null;
  if (!alvo) { console.error("Informe qual campanha: --enviar 1 ou --enviar 2"); process.exitCode = 1; return; }

  console.log(`\nMODO ENVIO — campanha ${qual}, ${alvo.length} e-mails\n`);
  let ok = 0, falhas = 0;

  for (const e of alvo) {
    const r = qual === "1"
      ? await sendCupomReengajamento({
          to: e.user.email, userName: primeiroNome(e.user.name), courseName: curso.title,
          courseSlug: SLUG, cupom: CUPOM, precoDe: brl(cheio), precoPor: brl(comDesc),
        })
      : await sendLembreteAulas({
          to: e.user.email, userName: primeiroNome(e.user.name), courseName: curso.title, courseSlug: SLUG,
        });

    if (r.ok) { ok++; console.log(`OK ${e.user.email}`); }
    else { falhas++; console.log(`!! ${e.user.email} — ${r.error}`); }
    await new Promise((res) => setTimeout(res, PAUSA_MS));
  }

  console.log(`\nEnviados: ${ok} | Falhas: ${falhas}`);
  console.log(`Registrado em /admin/emails.`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
