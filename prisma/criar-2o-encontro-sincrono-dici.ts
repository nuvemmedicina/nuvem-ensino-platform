/**
 * Cria o espaço da aula gravada do 2º Encontro Síncrono de cada módulo do DICI.
 *
 * Cada módulo (I a IV) tem um tópico "Encontro Síncrono" com UMA aula
 * ("Discussão de Casos Clínicos"), mas na verdade são 2 encontros por
 * módulo (confirmado pelos 8 LiveSession já agendados — ver
 * prisma/atualizar-encontros-dici.ts). Este script:
 *   1. Renomeia a aula existente para deixar claro que é o 1º encontro do módulo
 *   2. Cria uma segunda aula (sem vídeo ainda) para o 2º encontro do módulo
 *
 * A numeração 1º-8º acompanha a mesma numeração usada nos LiveSession
 * (Módulo I = 1º/2º, Módulo II = 3º/4º, Módulo III = 5º/6º, Módulo IV = 7º/8º).
 *
 *   npx tsx prisma/criar-2o-encontro-sincrono-dici.ts          # simulação, não grava
 *   npx tsx prisma/criar-2o-encontro-sincrono-dici.ts --gravar # aplica
 *
 * Idempotente: se a aula do 2º encontro já existir no tópico, não duplica.
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SLUG = "dici-neurogastroenterologia-2026";

function tituloAula(n: number) {
  return `${n}º Encontro Síncrono — Discussão de Casos Clínicos`;
}

async function main() {
  const gravar = process.argv.includes("--gravar");

  const curso = await prisma.course.findUnique({
    where: { slug: SLUG },
    select: {
      modules: {
        where: { title: { contains: "Módulo " } },
        orderBy: { order: "asc" },
        select: {
          id: true, title: true, order: true,
          topics: {
            select: {
              id: true, title: true,
              lessons: { orderBy: { order: "asc" }, select: { id: true, title: true, order: true, topicId: true } },
            },
          },
        },
      },
    },
  });
  if (!curso) throw new Error(`Curso ${SLUG} não encontrado.`);

  for (const [i, mod] of curso.modules.entries()) {
    const encontro = mod.topics.find((t) => t.title.includes("Encontro"));
    console.log(`\n${mod.title}`);
    if (!encontro) {
      console.log("  SEM tópico 'Encontro Síncrono' — pulando, confira manualmente.");
      continue;
    }

    const n1 = i * 2 + 1;
    const n2 = i * 2 + 2;
    const existente = encontro.lessons[0];

    if (!existente) {
      console.log(`  SEM aula nenhuma no tópico "${encontro.title}" — pulando, confira manualmente.`);
      continue;
    }

    // Renomeia a aula existente para deixar explícito que é o 1º encontro do módulo
    const tituloNovo1 = tituloAula(n1);
    if (existente.title !== tituloNovo1) {
      console.log(`  ~ renomear aula existente: "${existente.title}" -> "${tituloNovo1}"`);
      if (gravar) {
        await prisma.lesson.update({ where: { id: existente.id }, data: { title: tituloNovo1 } });
      }
    } else {
      console.log(`  = aula existente já está como "${tituloNovo1}"`);
    }

    // Cria a segunda aula, se ainda não existir
    const tituloNovo2 = tituloAula(n2);
    const jaTemSegunda = encontro.lessons.some((l) => l.title === tituloNovo2);
    if (jaTemSegunda) {
      console.log(`  = já existe a aula "${tituloNovo2}"`);
      continue;
    }

    const novaOrder = Math.max(...encontro.lessons.map((l) => l.order)) + 1;
    console.log(`  + criar aula "${tituloNovo2}" (order ${novaOrder}, sem vídeo ainda)`);
    if (gravar) {
      await prisma.lesson.create({
        data: {
          moduleId: mod.id,
          topicId: encontro.id,
          title: tituloNovo2,
          type: "VIDEO",
          order: novaOrder,
          isFree: false,
        },
      });
    }
  }

  console.log(gravar ? "\n✓ Gravado." : "\n(simulação — rode com --gravar para aplicar)");
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
