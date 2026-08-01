/**
 * Sincroniza os encontros síncronos do curso DICI 2026.
 *
 *   npx tsx prisma/atualizar-encontros-dici.ts          # simulação, não grava
 *   npx tsx prisma/atualizar-encontros-dici.ts --gravar # aplica
 *
 * Idempotente: encontro que já existe na data é ajustado, não duplicado.
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SLUG = "dici-neurogastroenterologia-2026";
const MEET_URL = "https://meet.google.com/ekb-sawm-daf?authuser=0";
const DURACAO_HORAS = 2;

// 19h30 no horário de Brasília (UTC-3, sem horário de verão) = 22:30 UTC
const DATAS = [
  "2026-08-05", "2026-08-26",
  "2026-09-16", "2026-09-30",
  "2026-10-14", "2026-10-28",
  "2026-11-11", "2026-11-25",
];

const inicio = (dia: string) => new Date(`${dia}T22:30:00.000Z`);
const fim = (dia: string) => new Date(inicio(dia).getTime() + DURACAO_HORAS * 60 * 60 * 1000);
const legivel = (d: Date) =>
  d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

async function main() {
  const gravar = process.argv.includes("--gravar");

  const curso = await prisma.course.findFirst({
    where: { slug: SLUG },
    select: { id: true, title: true, includes: true },
  });
  if (!curso) throw new Error(`Curso ${SLUG} não encontrado.`);

  const existentes = await prisma.liveSession.findMany({
    where: { courseId: curso.id },
    orderBy: { startAt: "asc" },
  });

  console.log(`Curso: ${curso.title}`);
  console.log(`Encontros hoje no banco: ${existentes.length}\n`);

  for (const [i, dia] of DATAS.entries()) {
    const startAt = inicio(dia);
    const endAt = fim(dia);
    const title = `${i + 1}° Encontro Síncrono`;

    // Casa pelo dia (não pelo horário), para achar o encontro mesmo com a hora errada
    const doDia = existentes.find(
      (s) => s.startAt.toISOString().slice(0, 10) === dia,
    );

    if (doDia) {
      const mudou =
        doDia.startAt.getTime() !== startAt.getTime() ||
        doDia.endAt.getTime() !== endAt.getTime() ||
        doDia.title !== title ||
        doDia.meetUrl !== MEET_URL;

      if (!mudou) {
        console.log(`= ${legivel(startAt)}  ${title} — já correto`);
        continue;
      }

      console.log(`~ ${legivel(startAt)}  ${title}`);
      console.log(`    de: ${legivel(doDia.startAt)} | "${doDia.title}" | ${doDia.meetUrl ?? "sem link"}`);
      if (gravar) {
        await prisma.liveSession.update({
          where: { id: doDia.id },
          data: { startAt, endAt, title, meetUrl: MEET_URL },
        });
      }
    } else {
      console.log(`+ ${legivel(startAt)}  ${title} — novo`);
      if (gravar) {
        await prisma.liveSession.create({
          data: { courseId: curso.id, title, startAt, endAt, meetUrl: MEET_URL },
        });
      }
    }
  }

  // Encontros do curso que não estão na lista: não são tocados, só reportados
  const naoListados = existentes.filter(
    (s) => !DATAS.includes(s.startAt.toISOString().slice(0, 10)),
  );
  if (naoListados.length) {
    console.log(`\nFora da lista (mantidos como estão):`);
    for (const s of naoListados) console.log(`  ${legivel(s.startAt)}  ${s.title}`);
  }

  // O texto de vendas anunciava 19h; o encontro é 19h30.
  // O campo usa \r\n, então a âncora precisa aceitar os dois finais de linha.
  const includesNovo = curso.includes?.replace(
    /(05 de agosto de 2026, às 19h)(?=\r?\n|$)/,
    "$130",
  );
  if (includesNovo && includesNovo !== curso.includes) {
    console.log(`\n~ Texto do curso: "às 19h" → "às 19h30"`);
    if (gravar) {
      await prisma.course.update({ where: { id: curso.id }, data: { includes: includesNovo } });
    }
  }

  console.log(gravar ? "\n✓ Gravado." : "\n(simulação — rode com --gravar para aplicar)");
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
