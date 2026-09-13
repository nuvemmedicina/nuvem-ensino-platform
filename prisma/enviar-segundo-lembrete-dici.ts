/**
 * Segundo lembrete de aulas do DICI — para quem já recebeu o lembrete de
 * 31/08/2026 (campanha 2 de enviar-campanhas-dici.ts) e continua sem assistir
 * nada. Mesmo público daquela campanha, texto novo (sendSegundoLembreteAulas).
 *
 *   npx tsx prisma/enviar-segundo-lembrete-dici.ts                # simulação
 *   npx tsx prisma/enviar-segundo-lembrete-dici.ts --teste        # só EMAIL_TESTE
 *   npx tsx prisma/enviar-segundo-lembrete-dici.ts --enviar       # dispara para todos
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

const SLUG = "dici-neurogastroenterologia-2026";
const EMAIL_TESTE = "anapgs.mkt@gmail.com";
const PAUSA_MS = 600;
const EMAIL_OK = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

// Segunda conta da Dra. Vera é da equipe, não de aluna.
const EXCLUIR = new Set(["veraluciaangeloandrade@gmail.com"]);

const primeiroNome = (n: string | null) => (n ?? "").replace(/\s+/g, " ").trim() || "Aluno";

async function main() {
  const teste = process.argv.includes("--teste");
  const enviar = process.argv.includes("--enviar");
  if (teste && enviar) {
    console.error("Use --teste OU --enviar, nunca os dois.");
    process.exitCode = 1;
    return;
  }

  const { sendSegundoLembreteAulas } = await import("@/lib/email");

  const curso = await prisma.course.findUniqueOrThrow({
    where: { slug: SLUG },
    select: { id: true, title: true },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: curso.id, status: "ACTIVE", user: { instructor: { is: null } } },
    include: {
      user: { select: { name: true, email: true, passwordHash: true, accounts: { select: { provider: true } } } },
      payments: true,
      progress: { where: { completed: true }, select: { id: true } },
    },
  });

  const alvo = enrollments.filter((e) => {
    const pago = e.payments.some((p) => p.status === "PAID");
    const cred = !!e.user.passwordHash || e.user.accounts.length > 0;
    const valido = EMAIL_OK.test(e.user.email) && !EXCLUIR.has(e.user.email);
    return pago && cred && e.progress.length === 0 && valido;
  });

  console.log(`SEGUNDO LEMBRETE — ${alvo.length} destinatários`);
  alvo.forEach((e) => console.log(`   .  ${primeiroNome(e.user.name)} <${e.user.email}>`));

  if (teste) {
    console.log(`\nMODO TESTE — um único e-mail vai para ${EMAIL_TESTE}. Nenhum aluno recebe nada.`);
    const r = await sendSegundoLembreteAulas({
      to: EMAIL_TESTE,
      userName: "Ana Paula",
      courseName: curso.title,
      courseSlug: SLUG,
    });
    console.log(r.ok ? `OK enviado para ${EMAIL_TESTE} (${r.id})` : `!! FALHOU — ${r.error}`);
    if (!r.ok) process.exitCode = 1;
    return;
  }

  if (!enviar) {
    console.log(`\n[SIMULAÇÃO] Nada saiu. Use --teste para conferir ou --enviar para disparar.`);
    return;
  }

  console.log(`\nMODO ENVIO — ${alvo.length} e-mails\n`);
  let ok = 0, falhas = 0;

  for (const e of alvo) {
    const r = await sendSegundoLembreteAulas({
      to: e.user.email,
      userName: primeiroNome(e.user.name),
      courseName: curso.title,
      courseSlug: SLUG,
    });
    if (r.ok) { ok++; console.log(`OK ${e.user.email}`); }
    else { falhas++; console.log(`!! ${e.user.email} — ${r.error}`); }
    await new Promise((res) => setTimeout(res, PAUSA_MS));
  }

  console.log(`\nEnviados: ${ok} | Falhas: ${falhas}`);
  console.log(`Registrado em /admin/emails.`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
