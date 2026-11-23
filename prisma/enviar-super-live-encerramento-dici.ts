/**
 * Avisa os alunos do DICI que o 8º e último encontro síncrono (25/11, 19h30)
 * virou a super live de encerramento, aberta, no YouTube, e não no Meet.
 *
 *   npx tsx prisma/enviar-super-live-encerramento-dici.ts --previa             # aviso e lembrete num HTML, nada sai
 *   npx tsx prisma/enviar-super-live-encerramento-dici.ts                      # simulação: quem receberia
 *   npx tsx prisma/enviar-super-live-encerramento-dici.ts --teste              # só para o e-mail de teste
 *   npx tsx prisma/enviar-super-live-encerramento-dici.ts --enviar             # dispara o aviso
 *   npx tsx prisma/enviar-super-live-encerramento-dici.ts --lembrete --enviar  # lembrete do dia
 *
 * --instrutores inclui também os professores do curso, sem repetir quem já é aluno.
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";
import { writeFileSync } from "fs";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const LINK_YOUTUBE = "https://www.youtube.com/live/OVpi7v0xv2A";
const CURSO_SLUG = "dici-neurogastroenterologia-2026";
const PREVIA = "campanha-dici/previa-email-super-live-encerramento.html";
const EMAIL_TESTE = "anapgs.mkt@gmail.com";
const PAUSA_MS = 600; // respeita o limite de requisições da Resend
const EMAIL_ENTREGAVEL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

async function main() {
  const previa = process.argv.includes("--previa");
  const teste = process.argv.includes("--teste");
  const enviar = process.argv.includes("--enviar");
  const tipo: "aviso" | "lembrete" = process.argv.includes("--lembrete") ? "lembrete" : "aviso";
  const comInstrutores = process.argv.includes("--instrutores");
  if ([previa, teste, enviar].filter(Boolean).length > 1) {
    console.error("Use só um modo: --previa, --teste ou --enviar.");
    process.exitCode = 1;
    return;
  }

  const { montarSuperLiveEncerramentoDici, sendSuperLiveEncerramentoDici } = await import("@/lib/email");
  const dados = (nome: string) => ({ nome, linkYoutube: LINK_YOUTUBE });

  if (previa) {
    const partes = (["aviso", "lembrete"] as const).map((t) => {
      const { subject, html } = montarSuperLiveEncerramentoDici(t, dados("Ana Paula"));
      return `<h2 style="font-family:Arial;padding:24px 16px 0">${t} · Assunto: ${subject}</h2>${html}`;
    });
    writeFileSync(PREVIA, partes.join("\n"));
    console.log(`Prévia gravada em ${PREVIA}. Nenhum e-mail saiu.`);
    return;
  }

  if (teste) {
    const r = await sendSuperLiveEncerramentoDici(tipo, EMAIL_TESTE, dados("Ana Paula"));
    console.log(r.ok ? `OK (${tipo}) enviado para ${EMAIL_TESTE}  (${r.id})` : `!! FALHOU — ${r.error}`);
    if (!r.ok) process.exitCode = 1;
    return;
  }

  const curso = await prisma.course.findFirst({ where: { slug: CURSO_SLUG }, select: { id: true, title: true } });
  if (!curso) throw new Error(`Curso ${CURSO_SLUG} não encontrado.`);

  const matriculas = await prisma.enrollment.findMany({
    where: { courseId: curso.id, status: "ACTIVE" },
    select: { user: { select: { name: true, email: true } } },
    orderBy: { enrolledAt: "asc" },
  });
  const instrutores = comInstrutores
    ? await prisma.instructor.findMany({
        where: {
          OR: [
            { courses: { some: { id: curso.id } } },
            { modules: { some: { module: { courseId: curso.id } } } },
            { lessonInstructors: { some: { lesson: { module: { courseId: curso.id } } } } },
          ],
        },
        select: { user: { select: { name: true, email: true } } },
      })
    : [];

  // Cada pessoa recebe uma vez só, mesmo que seja aluna e professora.
  const porEmail = new Map<string, string>();
  for (const p of [...matriculas, ...instrutores]) {
    const email = p.user.email?.toLowerCase().trim();
    if (email && !porEmail.has(email)) porEmail.set(email, p.user.name?.replace(/\s+/g, " ").trim() || "");
  }
  const todos = [...porEmail.entries()];
  const validos = todos.filter(([e]) => EMAIL_ENTREGAVEL.test(e));
  const invalidos = todos.filter(([e]) => !EMAIL_ENTREGAVEL.test(e));

  console.log(`${tipo.toUpperCase()} · ${curso.title}`);
  console.log(`Matrículas ativas: ${matriculas.length}${comInstrutores ? ` | professores: ${instrutores.length}` : ""}`);
  if (invalidos.length) {
    console.log(`\nE-mail inválido, não serão enviados (${invalidos.length}):`);
    invalidos.forEach(([e, n]) => console.log(`~  "${e}"  ${n}`));
  }
  console.log(`\nVão receber: ${validos.length}`);
  console.log(enviar ? "MODO ENVIO — os e-mails vão sair\n" : "SIMULAÇÃO — nenhum e-mail sai\n");

  let ok = 0;
  let falhas = 0;
  for (const [email, nome] of validos) {
    if (!enviar) {
      console.log(`.  ${nome} <${email}>`);
      continue;
    }
    const r = await sendSuperLiveEncerramentoDici(tipo, email, dados(nome));
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
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
