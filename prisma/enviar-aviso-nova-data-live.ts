/**
 * Aviso aos inscritos em /live de que a live passou de 18/11 para 25/11, às
 * 19h30, com o tema "Probióticos na prática clínica". A inscrição continua
 * valendo (mesmo eventSlug), então ninguém precisa se inscrever de novo.
 *
 * Só recebe quem se inscreveu até agora; quem se inscrever depois já vê a nova
 * data na página.
 *
 *   npx tsx prisma/enviar-aviso-nova-data-live.ts            # simulação, nada sai
 *   npx tsx prisma/enviar-aviso-nova-data-live.ts --previa   # grava a prévia em HTML, nada sai
 *   npx tsx prisma/enviar-aviso-nova-data-live.ts --teste    # só para o e-mail de teste
 *   npx tsx prisma/enviar-aviso-nova-data-live.ts --enviar   # dispara para todos
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";
import { writeFileSync } from "fs";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const EVENT_SLUG = "dici-live-novembro-2026";
// Quem se inscreveu depois da mudança já viu a data nova na página.
const MUDANCA = new Date("2026-11-11T14:40:00-03:00");
const PREVIA = "campanha-dici/previa-email-nova-data-live.html";
const EMAIL_TESTE = "anapgs.mkt@gmail.com";
const PAUSA_MS = 600; // respeita o limite de requisições da Resend
const EMAIL_ENTREGAVEL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/** "maria DA silva" → "Maria Da Silva": alguns cadastros vêm todo em minúsculas. */
const capitalizar = (nome: string) =>
  nome.replace(/\s+/g, " ").trim().toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, s, l) => s + l.toUpperCase());

async function main() {
  const previa = process.argv.includes("--previa");
  const teste = process.argv.includes("--teste");
  const enviar = process.argv.includes("--enviar");
  if ([previa, teste, enviar].filter(Boolean).length > 1) {
    console.error("Use só um modo: --previa, --teste ou --enviar.");
    process.exitCode = 1;
    return;
  }

  const { montarAvisoNovaDataLive, sendAvisoNovaDataLive } = await import("@/lib/email");

  if (previa) {
    const { subject, html } = montarAvisoNovaDataLive({ nome: "Ana Paula" });
    writeFileSync(PREVIA, `<h2 style="font-family:Arial;padding:24px 16px 0">Assunto: ${subject}</h2>${html}`);
    console.log(`Prévia gravada em ${PREVIA}. Nenhum e-mail saiu.`);
    return;
  }

  if (teste) {
    const r = await sendAvisoNovaDataLive(EMAIL_TESTE, { nome: "Ana Paula" });
    console.log(r.ok ? `OK enviado para ${EMAIL_TESTE}  (${r.id})` : `!! FALHOU — ${r.error}`);
    if (!r.ok) process.exitCode = 1;
    return;
  }

  const leads = await prisma.liveLead.findMany({
    where: { eventSlug: EVENT_SLUG, createdAt: { lt: MUDANCA } },
    orderBy: { createdAt: "asc" },
  });

  // Uma pessoa pode ter se inscrito duas vezes; manda um e-mail só.
  const porEmail = new Map<string, (typeof leads)[number]>();
  for (const l of leads) porEmail.set(l.email.toLowerCase().trim(), l);
  const unicos = [...porEmail.entries()];
  const validos = unicos.filter(([email]) => EMAIL_ENTREGAVEL.test(email));
  const invalidos = unicos.filter(([email]) => !EMAIL_ENTREGAVEL.test(email));

  console.log(`Inscritos até a mudança: ${leads.length} (${unicos.length} e-mails diferentes)`);
  if (invalidos.length) {
    console.log(`\nE-mail inválido, não serão enviados (${invalidos.length}) — avisar pelo WhatsApp:`);
    invalidos.forEach(([email, l]) => console.log(`~  "${email}"  ${l.nome}  ${l.telefone}`));
  }
  console.log(`\nVão receber: ${validos.length}`);
  console.log(enviar ? "MODO ENVIO — os e-mails vão sair\n" : "SIMULAÇÃO — nenhum e-mail sai\n");

  let ok = 0;
  let falhas = 0;

  for (const [email, l] of validos) {
    if (!enviar) {
      console.log(`.  ${capitalizar(l.nome)} <${email}>  ${l.especialidade}`);
      continue;
    }

    const r = await sendAvisoNovaDataLive(email, { nome: capitalizar(l.nome) });
    if (r.ok) {
      ok++;
      console.log(`OK ${email}  (${r.id})`);
    } else {
      falhas++;
      console.log(`!! ${email}  FALHOU — ${r.error}`);
    }

    await new Promise((res) => setTimeout(res, PAUSA_MS));
  }

  if (enviar) {
    console.log(`\nEnviados: ${ok} | Falhas: ${falhas}`);
    console.log(`Cada envio ficou registrado em /admin/emails.`);
  } else {
    console.log(`\n${validos.length} receberiam o e-mail.`);
    console.log(`Rode com --previa ou --teste para ver como chega, ou --enviar para disparar.`);
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
