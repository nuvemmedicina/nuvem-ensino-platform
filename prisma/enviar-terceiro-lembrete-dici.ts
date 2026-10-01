/**
 * Terceiro lembrete de aulas do DICI (01/10/2026) — para todo aluno com
 * matrícula ativa que ainda não concluiu nenhuma aula, pago ou cortesia.
 * Quem já tem senha ou login Google recebe sendTerceiroLembreteAulas; quem
 * nunca criou senha recebe o e-mail de primeiro acesso com link válido por
 * 7 dias, porque um lembrete de aula não resolve o problema dele.
 *
 *   npx tsx prisma/enviar-terceiro-lembrete-dici.ts                # simulação
 *   npx tsx prisma/enviar-terceiro-lembrete-dici.ts --teste        # só EMAIL_TESTE
 *   npx tsx prisma/enviar-terceiro-lembrete-dici.ts --enviar       # dispara para todos
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

const SLUG = "dici-neurogastroenterologia-2026";
const EMAIL_TESTE = "anapgs.mkt@gmail.com";
const PAUSA_MS = 600;
const VALIDADE_HORAS = 24 * 7;
const EMAIL_OK = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

// Segunda conta da Dra. Vera é da equipe, não de aluna.
const EXCLUIR = new Set(["veraluciaangeloandrade@gmail.com"]);

// "Dra. Araceli Lima" vira "Araceli", senão a saudação sai "Olá, Dra.!".
const TITULO = /^(dr|dra|drª|prof|profª|profa)\.?$/i;
const primeiroNome = (n: string | null) => {
  const partes = (n ?? "").replace(/\s+/g, " ").trim().split(" ");
  const nome = partes.find((p) => p && !TITULO.test(p)) ?? "Aluno";
  return nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase();
};

async function main() {
  const teste = process.argv.includes("--teste");
  const enviar = process.argv.includes("--enviar");
  if (teste && enviar) {
    console.error("Use --teste OU --enviar, nunca os dois.");
    process.exitCode = 1;
    return;
  }

  const { sendTerceiroLembreteAulas, sendSetPasswordEmail } = await import("@/lib/email");
  const { createPasswordResetToken } = await import("@/lib/tokens");

  const curso = await prisma.course.findUniqueOrThrow({ where: { slug: SLUG }, select: { id: true, title: true } });

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: curso.id, status: "ACTIVE", user: { instructor: { is: null }, role: "STUDENT" } },
    include: {
      user: { select: { name: true, email: true, passwordHash: true, accounts: { select: { provider: true } } } },
      progress: { where: { completed: true }, select: { id: true } },
    },
    orderBy: { enrolledAt: "asc" },
  });

  const alvo = enrollments
    .filter((e) => e.progress.length === 0 && EMAIL_OK.test(e.user.email) && !EXCLUIR.has(e.user.email))
    .map((e) => ({
      email: e.user.email,
      nome: primeiroNome(e.user.name),
      temCred: !!e.user.passwordHash || e.user.accounts.length > 0,
    }));

  const lembrete = alvo.filter((a) => a.temCred);
  const semSenha = alvo.filter((a) => !a.temCred);
  console.log(`TERCEIRO LEMBRETE — ${alvo.length} destinatários (${lembrete.length} lembrete, ${semSenha.length} criar senha)`);
  alvo.forEach((a) => console.log(`   ${a.temCred ? "." : "S"}  ${a.nome} <${a.email}>`));

  const disparar = async (a: (typeof alvo)[number], to: string) => {
    if (a.temCred) {
      return sendTerceiroLembreteAulas({ to, userName: a.nome, courseName: curso.title, courseSlug: SLUG });
    }
    // O token é sempre do aluno; no teste só o destinatário muda.
    const token = await createPasswordResetToken(a.email, VALIDADE_HORAS);
    return sendSetPasswordEmail({ to, userName: a.nome, courseName: curso.title, token, expiresLabel: "7 dias" });
  };

  if (teste) {
    console.log(`\nMODO TESTE — o lembrete vai para ${EMAIL_TESTE}. Nenhum aluno recebe nada.`);
    const r = await sendTerceiroLembreteAulas({ to: EMAIL_TESTE, userName: "Ana Paula", courseName: curso.title, courseSlug: SLUG });
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
  for (const a of alvo) {
    const r = await disparar(a, a.email);
    if (r.ok) { ok++; console.log(`OK ${a.email}${a.temCred ? "" : " (criar senha)"}`); }
    else { falhas++; console.log(`!! ${a.email} — ${r.error}`); }
    await new Promise((res) => setTimeout(res, PAUSA_MS));
  }
  console.log(`\nEnviados: ${ok} | Falhas: ${falhas}`);
  console.log(`Registrado em /admin/emails.`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
