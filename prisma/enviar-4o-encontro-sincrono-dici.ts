/**
 * Envia o convite (ou o lembrete) do 4º Encontro Síncrono aos alunos do DICI.
 *
 *   npx tsx prisma/enviar-4o-encontro-sincrono-dici.ts                    # simulação, nada sai
 *   npx tsx prisma/enviar-4o-encontro-sincrono-dici.ts --teste            # só para o e-mail de teste
 *   npx tsx prisma/enviar-4o-encontro-sincrono-dici.ts --enviar           # dispara para todos
 *   npx tsx prisma/enviar-4o-encontro-sincrono-dici.ts --lembrete --teste # versão curta do dia
 *
 * --instrutores inclui também os professores do curso (do curso, dos módulos e
 * das aulas), sem repetir quem já recebe como aluno.
 *
 * Mesma estrutura de prisma/enviar-encontro-sincrono.ts (usado para o 2º
 * encontro) — só troca os dados do ENCONTRO abaixo.
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

const ENCONTRO = {
  cursoContains: "Aperfeiçoamento em DICI",
  courseName: "Curso de Aperfeiçoamento em DICI",
  sessionTitle: "4º Encontro Síncrono",
  dateLabel: "Quarta-feira, 30 de setembro de 2026",
  timeLabel: "19h30",
  pauta:
    'tema "DICI na Prática: Discussão de Casos Clínicos Integrados e Desafios Diagnósticos", apresentado pelo Prof. Dr. Marcos Antonio Custódio Neto da Silva (gastroenterologista e hepatologista, professor de Medicina da UFMA e da UEMASUL)',
  // Sem o ?authuser=0 do link original: aquele parâmetro força a primeira conta
  // Google de quem clica e derruba quem tem duas contas logadas.
  meetUrl: "https://meet.google.com/ekb-sawm-daf",
  // O aviso sai antes da véspera, então não pode dizer "Amanhã"
  quandoLabel: "Nesta quarta-feira",
  despedida: "Até quarta!",
};

async function main() {
  const teste = process.argv.includes("--teste");
  const enviar = process.argv.includes("--enviar");
  const tipo: "aviso" | "lembrete" = process.argv.includes("--lembrete") ? "lembrete" : "aviso";
  const comInstrutores = process.argv.includes("--instrutores");
  const paraArg = process.argv.find((a) => a.startsWith("--para="))?.split("=")[1];

  if (teste && enviar) {
    console.error("Use --teste OU --enviar, nunca os dois.");
    process.exitCode = 1;
    return;
  }

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
    quandoLabel: ENCONTRO.quandoLabel,
    despedida: ENCONTRO.despedida,
  };

  const rotulo = tipo === "aviso" ? "AVISO" : "LEMBRETE (dia do encontro)";

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
      console.log(`  npx tsx prisma/enviar-4o-encontro-sincrono-dici.ts${tipo === "lembrete" ? " --lembrete" : ""} --enviar`);
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

  const jaAlunos = new Set(matriculas.map((m) => m.user.email?.toLowerCase()));
  const soInstrutores = instrutores.filter((i) => !jaAlunos.has(i.user.email?.toLowerCase()));
  const destinatarios = [...matriculas, ...soInstrutores];

  const validos = destinatarios.filter((m) => EMAIL_ENTREGAVEL.test(m.user.email ?? ""));
  const invalidos = destinatarios.filter((m) => !EMAIL_ENTREGAVEL.test(m.user.email ?? ""));

  console.log(`${rotulo}`);
  console.log(`Curso: ${curso.title}`);
  console.log(`Matrículas ativas: ${matriculas.length}`);
  if (comInstrutores) {
    console.log(`Instrutores do curso: ${instrutores.length} (${instrutores.length - soInstrutores.length} já são alunos)`);
    soInstrutores.forEach((i) => console.log(`   + ${i.user.name ?? ""} <${i.user.email}>`));
  }
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
