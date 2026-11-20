/**
 * E-mails da live "Probióticos na prática clínica" (25/11/2026, 19h30) para
 * os inscritos em /live. Seis etapas, cada uma disparada à mão no seu dia:
 *
 *   vespera      ter 24/11, noite    lembrete + salvar na agenda
 *   hoje         qua 25/11, manhã    lembrete do dia
 *   1hora        qua 25/11, 18h30    "começa em 1 hora"
 *   gravacao     qui 26/11           gravação + oferta de 30% do DICI
 *   blackfriday  sex 27/11           últimos 3 dias
 *   ultimodia    dom 29/11, manhã    termina hoje às 23h59
 *
 * As três últimas levam a oferta e NÃO vão para quem já é aluno do DICI
 * (comparado por e-mail e por nome, por causa das contas duplicadas), nem para
 * quem comprou o DICI depois da live.
 *
 *   npx tsx prisma/enviar-emails-live-probioticos.ts --previa                    # as 6 etapas num HTML, nada sai
 *   npx tsx prisma/enviar-emails-live-probioticos.ts --etapa=vespera             # simulação: quem receberia
 *   npx tsx prisma/enviar-emails-live-probioticos.ts --etapa=vespera --teste     # só para o e-mail de teste
 *   npx tsx prisma/enviar-emails-live-probioticos.ts --etapa=vespera --enviar    # dispara para todos
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";
import { writeFileSync } from "fs";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Preencher com o link da transmissão quando o Wallace criar a live no
// YouTube (@nuvemensino). O envio real é bloqueado enquanto estiver vazio.
const LINK_YOUTUBE = "";
const LINK_PREVIA = "https://www.youtube.com/@nuvemensino";

const EVENT_SLUG = "dici-live-novembro-2026";
const CURSO_DICI = "dici-neurogastroenterologia-2026";
const PREVIA = "campanha-dici/previa-emails-live-probioticos.html";
const EMAIL_TESTE = "anapgs.mkt@gmail.com";
const PAUSA_MS = 600; // respeita o limite de requisições da Resend
const EMAIL_ENTREGAVEL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/** "maria DA silva" → "Maria Da Silva": alguns cadastros vêm todo em minúsculas. */
const capitalizar = (nome: string) =>
  nome.replace(/\s+/g, " ").trim().toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, s, l) => s + l.toUpperCase());

/** Nome para comparar contas: sem acento, sem "Dr./Dra.", minúsculo. */
const chaveNome = (nome: string) =>
  nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/^(dra?\.?)\s+/, "").replace(/\s+/g, " ").trim();

async function main() {
  const { montarEmailLiveProbioticos, sendEmailLiveProbioticos, ETAPAS_LIVE_PROBIOTICOS, ETAPAS_COM_OFERTA } =
    await import("@/lib/email");
  type Etapa = (typeof ETAPAS_LIVE_PROBIOTICOS)[number];

  const previa = process.argv.includes("--previa");
  const teste = process.argv.includes("--teste");
  const enviar = process.argv.includes("--enviar");

  if (previa) {
    const partes = ETAPAS_LIVE_PROBIOTICOS.map((etapa) => {
      const { subject, html } = montarEmailLiveProbioticos(etapa, { nome: "Ana Paula", linkYoutube: LINK_YOUTUBE || LINK_PREVIA });
      return `<h2 style="font-family:Arial;padding:32px 16px 0;margin:0;color:#00475e">${etapa} · Assunto: ${subject}</h2>${html}`;
    });
    writeFileSync(PREVIA, partes.join("\n"));
    console.log(`Prévia das ${partes.length} etapas gravada em ${PREVIA}. Nenhum e-mail saiu.`);
    return;
  }

  const etapa = process.argv.find((a) => a.startsWith("--etapa="))?.slice(8) as Etapa | undefined;
  if (!etapa || !ETAPAS_LIVE_PROBIOTICOS.includes(etapa)) {
    console.error(`Informe a etapa: --etapa=${ETAPAS_LIVE_PROBIOTICOS.join("|")}`);
    process.exitCode = 1;
    return;
  }
  if (teste && enviar) {
    console.error("Use só um modo: --teste ou --enviar.");
    process.exitCode = 1;
    return;
  }
  if ((teste || enviar) && !LINK_YOUTUBE) {
    console.error("Falta o link da live no YouTube (LINK_YOUTUBE no topo do script). Nada foi enviado.");
    process.exitCode = 1;
    return;
  }

  const dados = (nome: string) => ({ nome, linkYoutube: LINK_YOUTUBE });

  if (teste) {
    const r = await sendEmailLiveProbioticos(etapa, EMAIL_TESTE, dados("Ana Paula"));
    console.log(r.ok ? `OK enviado para ${EMAIL_TESTE}  (${r.id})` : `!! FALHOU — ${r.error}`);
    if (!r.ok) process.exitCode = 1;
    return;
  }

  const leads = await prisma.liveLead.findMany({ where: { eventSlug: EVENT_SLUG }, orderBy: { createdAt: "asc" } });

  // Uma pessoa pode ter se inscrito duas vezes; manda um e-mail só.
  const porEmail = new Map<string, (typeof leads)[number]>();
  for (const l of leads) porEmail.set(l.email.toLowerCase().trim(), l);
  let unicos = [...porEmail.entries()];

  let alunos: [string, (typeof leads)[number]][] = [];
  if (ETAPAS_COM_OFERTA.includes(etapa)) {
    const matriculas = await prisma.enrollment.findMany({
      where: { course: { slug: CURSO_DICI }, status: { in: ["ACTIVE", "COMPLETED"] } },
      select: { user: { select: { name: true, email: true } } },
    });
    const emails = new Set(matriculas.map((m) => m.user.email.toLowerCase().trim()));
    const nomes = new Set(matriculas.map((m) => chaveNome(m.user.name ?? "")).filter(Boolean));
    const ehAluno = ([email, l]: [string, (typeof leads)[number]]) => emails.has(email) || nomes.has(chaveNome(l.nome));
    alunos = unicos.filter(ehAluno);
    unicos = unicos.filter((u) => !ehAluno(u));
  }

  const validos = unicos.filter(([email]) => EMAIL_ENTREGAVEL.test(email));
  const invalidos = unicos.filter(([email]) => !EMAIL_ENTREGAVEL.test(email));

  console.log(`Etapa: ${etapa}`);
  console.log(`Inscritos: ${leads.length} (${porEmail.size} e-mails diferentes)`);
  if (alunos.length) console.log(`Já são alunos do DICI, ficam de fora da oferta: ${alunos.length}`);
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
    const r = await sendEmailLiveProbioticos(etapa, email, dados(capitalizar(l.nome)));
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
    console.log(`\n${validos.length} receberiam o e-mail. Use --teste para ver como chega, ou --enviar para disparar.`);
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
