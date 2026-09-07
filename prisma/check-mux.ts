/**
 * Cruza os assets do Mux com as aulas do banco:
 *  - quantos existem e em que estado estão (ready / preparing / errored)
 *  - quais não têm aula apontando para eles (órfãos, ocupando vaga à toa)
 *  - quais aulas apontam para asset que não existe mais no Mux
 *
 *   npx tsx prisma/check-mux.ts
 *
 * Só leitura. Não cria nem apaga nada.
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const auth = Buffer.from(`${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`).toString("base64");

async function mux(path: string) {
  const r = await fetch(`https://api.mux.com${path}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!r.ok) throw new Error(`Mux ${r.status} em ${path}: ${(await r.text()).slice(0, 300)}`);
  return r.json();
}

function minutos(s?: number) {
  if (!s) return "";
  const m = Math.floor(s / 60);
  return `${m}min`;
}

async function main() {
  const assets: any[] = [];
  let page = 1;
  for (;;) {
    const { data } = await mux(`/video/v1/assets?limit=100&page=${page}`);
    assets.push(...data);
    if (data.length < 100) break;
    page++;
  }

  const aulas = await prisma.lesson.findMany({
    where: { muxAssetId: { not: null } },
    select: {
      title: true, muxAssetId: true,
      module: { select: { course: { select: { title: true } } } },
    },
  });
  const porAsset = new Map(aulas.map((a) => [a.muxAssetId!, a]));

  console.log(`ASSETS NO MUX: ${assets.length}`);
  const porStatus = assets.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`Por status: ${JSON.stringify(porStatus)}\n`);

  const orfaos: any[] = [];
  for (const a of assets) {
    const aula = porAsset.get(a.id);
    const marca = aula ? "  em uso " : "> ORFAO  ";
    const onde = aula ? `${aula.module.course.title.slice(0, 30)} | ${aula.title.slice(0, 40)}` : "(nenhuma aula aponta para ele)";
    console.log(`${marca} ${a.status.padEnd(10)} ${minutos(a.duration).padStart(6)}  ${a.created_at ? new Date(Number(a.created_at) * 1000).toLocaleDateString("pt-BR") : ""}  ${onde}`);
    if (!aula) orfaos.push(a);
  }

  const idsMux = new Set(assets.map((a) => a.id));
  const quebradas = aulas.filter((a) => !idsMux.has(a.muxAssetId!));

  console.log(`\nRESUMO`);
  console.log(`  assets no Mux ............. ${assets.length}`);
  console.log(`  em uso por alguma aula .... ${assets.length - orfaos.length}`);
  console.log(`  órfãos (vaga desperdiçada)  ${orfaos.length}`);
  console.log(`  aulas apontando para asset que não existe mais no Mux: ${quebradas.length}`);
  for (const q of quebradas) console.log(`     ! ${q.module.course.title.slice(0, 30)} | ${q.title}`);
  if (orfaos.length) {
    console.log(`\n  IDs dos órfãos (para conferir no painel antes de apagar):`);
    for (const o of orfaos) console.log(`     ${o.id}`);
  }
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
