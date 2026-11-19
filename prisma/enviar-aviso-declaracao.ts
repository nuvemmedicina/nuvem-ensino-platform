/**
 * Avisa os alunos do DICI que pagaram de que a declaração de matrícula pode
 * ser baixada pela área do aluno. Fica de fora quem entrou sem pagamento
 * confirmado (cortesia, bolsa, pendente) — por enquanto só o DICI.
 *
 *   npx tsx prisma/enviar-aviso-declaracao.ts           # simulação, nada sai
 *   npx tsx prisma/enviar-aviso-declaracao.ts --teste   # só para o e-mail de teste
 *   npx tsx prisma/enviar-aviso-declaracao.ts --enviar  # dispara para todos
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

const CURSO_CONTAINS = "Aperfeiçoamento em DICI";

async function main() {
  const teste = process.argv.includes("--teste");
  const enviar = process.argv.includes("--enviar");
  const paraArg = process.argv.find((a) => a.startsWith("--para="))?.split("=")[1];

  if (teste && enviar) {
    console.error("Use --teste OU --enviar, nunca os dois.");
    process.exitCode = 1;
    return;
  }

  const { sendAvisoDeclaracaoMatricula } = await import("@/lib/email");

  if (teste) {
    const destino = paraArg ?? EMAIL_TESTE;
    if (!EMAIL_ENTREGAVEL.test(destino)) {
      console.error(`Endereço de teste inválido: "${destino}"`);
      process.exitCode = 1;
      return;
    }
    console.log(`MODO TESTE`);
    console.log(`Um único e-mail vai para ${destino}. Nenhum aluno recebe nada.\n`);

    const r = await sendAvisoDeclaracaoMatricula({ to: destino, userName: "Ana Paula" });
    if (r.ok) {
      console.log(`OK enviado para ${destino}  (${r.id})`);
      console.log(`\nConfira na sua caixa. Se estiver bom, rode:`);
      console.log(`  npx tsx prisma/enviar-aviso-declaracao.ts --enviar`);
    } else {
      console.log(`!! FALHOU — ${r.error}`);
      process.exitCode = 1;
    }
    return;
  }

  const curso = await prisma.course.findFirst({
    where: { title: { contains: CURSO_CONTAINS } },
    select: { id: true, title: true },
  });
  if (!curso) {
    console.error(`Curso não encontrado por "${CURSO_CONTAINS}".`);
    process.exitCode = 1;
    return;
  }

  const matriculas = await prisma.enrollment.findMany({
    where: {
      courseId: curso.id,
      status: "ACTIVE",
      payments: { some: { status: "PAID", amount: { gt: 0 } } },
    },
    select: { user: { select: { name: true, email: true } } },
    orderBy: { enrolledAt: "asc" },
  });

  const vistos = new Set<string>();
  const destinatarios = matriculas.filter((m) => {
    const chave = m.user.email?.toLowerCase() ?? "";
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });

  const validos = destinatarios.filter((m) => EMAIL_ENTREGAVEL.test(m.user.email ?? ""));
  const invalidos = destinatarios.filter((m) => !EMAIL_ENTREGAVEL.test(m.user.email ?? ""));

  console.log(`Curso: ${curso.title}`);
  console.log(`Matrículas ativas e pagas: ${matriculas.length}`);
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

    const r = await sendAvisoDeclaracaoMatricula({ to: email, userName: nome });
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
