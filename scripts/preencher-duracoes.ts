/**
 * Acerta a duração (em minutos, arredondada para cima) das aulas que têm
 * vídeo no Mux: preenche as que estão sem duração e corrige as que divergem
 * do vídeo. Regra da Ana (07/10/2026): vale sempre o tempo do vídeo.
 *
 * Por padrão só mostra o que faria. Para gravar:
 *   npx tsx scripts/preencher-duracoes.ts --gravar
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import Mux from "@mux/mux-node";
import { config } from "dotenv";

config({ path: ".env.local" });

const gravar = process.argv.includes("--gravar");
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });
const mux = new Mux({ tokenId: process.env.MUX_TOKEN_ID!, tokenSecret: process.env.MUX_TOKEN_SECRET! });

async function main() {
  const aulas = await prisma.lesson.findMany({
    where: { muxAssetId: { not: null } },
    select: { id: true, title: true, duration: true, muxAssetId: true, module: { select: { course: { select: { slug: true } } } } },
    orderBy: [{ moduleId: "asc" }, { order: "asc" }],
  });

  const preencher: { id: string; titulo: string; curso: string; minutos: number }[] = [];
  const divergentes: { id: string; titulo: string; curso: string; cadastrado: number; video: number }[] = [];

  for (const aula of aulas) {
    let segundos: number | undefined;
    try {
      const asset = await mux.video.assets.retrieve(aula.muxAssetId!);
      if (asset.status !== "ready") continue;
      segundos = asset.duration ?? undefined;
    } catch {
      console.warn(`Vídeo não encontrado no Mux: ${aula.title.trim()}`);
      continue;
    }
    if (!segundos) continue;
    const minutos = Math.ceil(segundos / 60);
    const curso = aula.module.course.slug;
    if (aula.duration == null) preencher.push({ id: aula.id, titulo: aula.title.trim(), curso, minutos });
    else if (aula.duration !== minutos) divergentes.push({ id: aula.id, titulo: aula.title.trim(), curso, cadastrado: aula.duration, video: minutos });
  }

  console.log(`\nAULAS SEM DURAÇÃO, A PREENCHER: ${preencher.length}`);
  for (const p of preencher) console.log(`  ${String(p.minutos).padStart(3)} min  ${p.titulo}  (${p.curso})`);

  console.log(`\nDURAÇÃO CADASTRADA DIFERENTE DO VÍDEO, A CORRIGIR: ${divergentes.length}`);
  for (const d of divergentes) console.log(`  de ${d.cadastrado} para ${d.video} min  ${d.titulo}  (${d.curso})`);

  if (!gravar) {
    console.log("\nNada foi gravado. Rode com --gravar para aplicar.");
    return;
  }

  // Uma aula por vez: numa transação única o Neon estoura o tempo limite.
  // Cada gravação só define a duração, então rodar de novo é seguro.
  for (const p of preencher) await prisma.lesson.update({ where: { id: p.id }, data: { duration: p.minutos } });
  for (const d of divergentes) await prisma.lesson.update({ where: { id: d.id }, data: { duration: d.video } });
  console.log(`\nGravado: ${preencher.length} preenchidas e ${divergentes.length} corrigidas.`);
}

main().finally(() => prisma.$disconnect());
