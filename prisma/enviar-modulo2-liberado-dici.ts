/**
 * Avisa a turma do DICI (alunos e professores, todos matriculados no curso)
 * que o Módulo II — DICI na Prática Clínica — foi liberado.
 *
 *   npx tsx prisma/enviar-modulo2-liberado-dici.ts                 # simulação, nada sai
 *   npx tsx prisma/enviar-modulo2-liberado-dici.ts --teste          # só para o e-mail de teste
 *   npx tsx prisma/enviar-modulo2-liberado-dici.ts --enviar         # dispara para toda a turma
 *
 * Só recebem matrículas ACTIVE no curso — mesma regra do enviar-encontro-sincrono.ts.
 * Os professores do curso também estão matriculados, então já ficam incluídos.
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const EMAIL_TESTE = "anapgs.mkt@gmail.com";
const PAUSA_MS = 600;
const EMAIL_ENTREGAVEL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

const SLUG = "dici-neurogastroenterologia-2026";
const COURSE_NAME = "Curso de Aperfeiçoamento em DICI";
const MODULO_TITLE = "Módulo II — DICI na Prática Clínica";
const DESTAQUES = [
  "Pirose funcional, dispepsia funcional e dor torácica funcional",
  "Síndrome do intestino irritável, constipação e diarreia funcional",
  "Gastroparesia, ruminação, globus e disfagia funcional",
  "Discussão de casos clínicos",
];

async function main() {
  const teste = process.argv.includes("--teste");
  const enviar = process.argv.includes("--enviar");
  const paraArg = process.argv.find((a) => a.startsWith("--para="))?.split("=")[1];

  if (teste && enviar) {
    console.error("Use --teste OU --enviar, nunca os dois.");
    process.exitCode = 1;
    return;
  }

  const { sendModuloLiberado } = await import("@/lib/email");

  const curso = await prisma.course.findUniqueOrThrow({
    where: { slug: SLUG },
    select: { id: true, title: true },
  });

  const dados = {
    courseName: COURSE_NAME,
    courseSlug: SLUG,
    moduloTitle: MODULO_TITLE,
    destaques: DESTAQUES,
  };

  if (teste) {
    const destino = paraArg ?? EMAIL_TESTE;
    if (!EMAIL_ENTREGAVEL.test(destino)) {
      console.error(`Endereço de teste inválido: "${destino}"`);
      process.exitCode = 1;
      return;
    }
    console.log(`MODO TESTE — um único e-mail vai para ${destino}. Ninguém mais recebe nada.\n`);

    const r = await sendModuloLiberado({ to: destino, userName: "Ana Paula", ...dados });
    if (r.ok) {
      console.log(`OK enviado para ${destino}  (${r.id})`);
      console.log(`\nConfira na sua caixa. Se estiver bom, rode:`);
      console.log(`  npx tsx prisma/enviar-modulo2-liberado-dici.ts --enviar`);
    } else {
      console.log(`!! FALHOU — ${r.error}`);
      process.exitCode = 1;
    }
    return;
  }

  const matriculas = await prisma.enrollment.findMany({
    where: { courseId: curso.id, status: "ACTIVE" },
    select: { user: { select: { name: true, email: true } } },
    orderBy: { enrolledAt: "asc" },
  });

  const validos = matriculas.filter((m) => EMAIL_ENTREGAVEL.test(m.user.email ?? ""));
  const invalidos = matriculas.filter((m) => !EMAIL_ENTREGAVEL.test(m.user.email ?? ""));

  console.log(`Curso: ${curso.title}`);
  console.log(`Módulo: ${MODULO_TITLE}`);
  console.log(`Matrículas ativas: ${matriculas.length}`);
  if (invalidos.length) {
    console.log(`\nE-mail inválido, não serão enviados (${invalidos.length}):`);
    invalidos.forEach((m) => console.log(`~  "${m.user.email}"  ${m.user.name ?? ""}`));
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

    const r = await sendModuloLiberado({ to: email, userName: nome, ...dados });
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
