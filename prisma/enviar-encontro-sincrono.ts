/**
 * Envia o convite (ou o lembrete) do 2º Encontro Síncrono aos alunos do DICI.
 *
 *   npx tsx prisma/enviar-encontro-sincrono.ts                    # simulação, nada sai
 *   npx tsx prisma/enviar-encontro-sincrono.ts --teste            # só para o e-mail de teste
 *   npx tsx prisma/enviar-encontro-sincrono.ts --enviar           # dispara para todos
 *   npx tsx prisma/enviar-encontro-sincrono.ts --lembrete --teste # versão curta do dia
 *
 * Modos:
 *   (nenhum)     lista quem receberia, sem enviar nada
 *   --teste      manda UM e-mail para EMAIL_TESTE (ou --para=alguem@dominio.com)
 *   --enviar     manda de verdade, para toda a turma
 *
 * --teste e --enviar são mutuamente exclusivos de propósito: sem isso, um
 * --teste esquecido junto do --enviar disparava para a turma inteira.
 *
 * Só recebem alunos com matrícula ACTIVE no curso. PENDING e CANCELLED ficam
 * de fora — quem não pagou ou desistiu não deve receber convite de aula.
 *
 * Endereços malformados são separados antes do envio, mesma trava do
 * enviar-acesso-em-lote.ts: sem ela o envio era contado como sucesso e o
 * e-mail nunca chegava.
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const EMAIL_TESTE = "anapgs.mkt@gmail.com";
const PAUSA_MS = 600; // respeita o limite de requisições da Resend

const EMAIL_ENTREGAVEL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/** Dados do encontro. Texto aprovado pela coordenação em 04/08/2026. */
const ENCONTRO = {
  cursoContains: "Aperfeiçoamento em DICI",
  courseName: "Curso de Aperfeiçoamento em DICI",
  sessionTitle: "2º Encontro Síncrono",
  dateLabel: "Quarta-feira, 26 de agosto de 2026",
  timeLabel: "19h30",
  pauta: "Módulo I: Fundamentos dos Distúrbios da Interação Cérebro-Intestino.",
  // Sem o ?authuser=0 do link original: aquele parâmetro força a primeira conta
  // Google de quem clica e derruba quem tem duas contas logadas.
  meetUrl: "https://meet.google.com/ekb-sawm-daf",
};

async function main() {
  const teste = process.argv.includes("--teste");
  const enviar = process.argv.includes("--enviar");
  const tipo: "aviso" | "lembrete" = process.argv.includes("--lembrete") ? "lembrete" : "aviso";
  const paraArg = process.argv.find((a) => a.startsWith("--para="))?.split("=")[1];

  if (teste && enviar) {
    console.error("Use --teste OU --enviar, nunca os dois.");
    process.exitCode = 1;
    return;
  }

  // Importado aqui dentro porque lib/email lê variáveis de ambiente na carga
  const { sendEncontroSincrono } = await import("@/lib/email");

  const curso = await prisma.course.findFirst({
    where: { title: { contains: ENCONTRO.cursoContains } },
    select: { id: true, title: true },
  });
  if (!curso) {
    console.error(`Curso não encontrado por "${ENCONTRO.cursoContains}".`);
    process.exitCode = 1;
    return;
  }

  const dados = {
    tipo,
    courseName: ENCONTRO.courseName,
    sessionTitle: ENCONTRO.sessionTitle,
    dateLabel: ENCONTRO.dateLabel,
    timeLabel: ENCONTRO.timeLabel,
    pauta: ENCONTRO.pauta,
    meetUrl: ENCONTRO.meetUrl,
  };

  const rotulo = tipo === "aviso" ? "AVISO (véspera)" : "LEMBRETE (dia do encontro)";

  // ─── Modo teste: um único envio, nenhum aluno é tocado ───────────────────
  if (teste) {
    const destino = paraArg ?? EMAIL_TESTE;
    if (!EMAIL_ENTREGAVEL.test(destino)) {
      console.error(`Endereço de teste inválido: "${destino}"`);
      process.exitCode = 1;
      return;
    }
    console.log(`MODO TESTE — ${rotulo}`);
    console.log(`Um único e-mail vai para ${destino}. Nenhum aluno recebe nada.\n`);

    const r = await sendEncontroSincrono({ to: destino, userName: "Ana Paula", ...dados });
    if (r.ok) {
      console.log(`OK enviado para ${destino}  (${r.id})`);
      console.log(`\nConfira na sua caixa. Se estiver bom, rode:`);
      console.log(`  npx tsx prisma/enviar-encontro-sincrono.ts${tipo === "lembrete" ? " --lembrete" : ""} --enviar`);
    } else {
      console.log(`!! FALHOU — ${r.error}`);
      process.exitCode = 1;
    }
    return;
  }

  // ─── Turma ──────────────────────────────────────────────────────────────
  const matriculas = await prisma.enrollment.findMany({
    where: { courseId: curso.id, status: "ACTIVE" },
    select: { user: { select: { name: true, email: true } } },
    orderBy: { enrolledAt: "asc" },
  });

  const validos = matriculas.filter((m) => EMAIL_ENTREGAVEL.test(m.user.email ?? ""));
  const invalidos = matriculas.filter((m) => !EMAIL_ENTREGAVEL.test(m.user.email ?? ""));

  console.log(`${rotulo}`);
  console.log(`Curso: ${curso.title}`);
  console.log(`Matrículas ativas: ${matriculas.length}`);
  if (invalidos.length) {
    console.log(`\nE-mail inválido, não serão enviados (${invalidos.length}):`);
    invalidos.forEach((m) => console.log(`~  "${m.user.email}"  ${m.user.name ?? ""}`));
    console.log(`Corrija o cadastro desses alunos e rode de novo.\n`);
  }
  console.log(`Vão receber: ${validos.length}`);
  console.log(enviar ? "MODO ENVIO — os e-mails vão sair\n" : "SIMULAÇÃO — nenhum e-mail sai\n");

  let ok = 0;
  let falhas = 0;

  for (const m of validos) {
    const email = m.user.email!;
    const nome = m.user.name?.replace(/\s+/g, " ").trim() || "Aluno";

    if (!enviar) {
      console.log(`.  ${nome} <${email}>`);
      continue;
    }

    const r = await sendEncontroSincrono({ to: email, userName: nome, ...dados });
    if (r.ok) {
      ok++;
      console.log(`OK ${email}  (${r.id})`);
    } else {
      falhas++;
      console.log(`!! ${email}  FALHOU — ${r.error}`);
    }

    await new Promise((res) => setTimeout(res, PAUSA_MS));
  }

  const pulados = invalidos.length ? ` | Pulados por e-mail inválido: ${invalidos.length}` : "";

  if (enviar) {
    console.log(`\nEnviados: ${ok} | Falhas: ${falhas}${pulados}`);
    console.log(`Cada envio ficou registrado em /admin/emails.`);
  } else {
    console.log(`\n${validos.length} receberiam o e-mail${pulados}`);
    console.log(`Rode com --teste para ver como chega, ou --enviar para disparar.`);
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
