/**
 * Raio-x de um módulo do DICI, organizado por tópico, cruzando cada aula
 * com os ativos que existem de fato na conta do Mux.
 * Só leitura.
 *
 *   npx tsx prisma/check-modulo1.ts [numeroDoModulo]
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SLUG = "dici-neurogastroenterologia-2026";
const auth = Buffer.from(`${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`).toString("base64");

/** playbackId -> { assetId, status, duration } de tudo que existe na conta */
async function playbacksDoMux() {
  const mapa = new Map<string, { assetId: string; status: string; duration?: number }>();
  let page = 1;
  for (;;) {
    const r = await fetch(`https://api.mux.com/video/v1/assets?limit=100&page=${page}`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!r.ok) throw new Error(`Mux ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const { data } = await r.json();
    for (const a of data) {
      for (const p of a.playback_ids ?? []) {
        mapa.set(p.id, { assetId: a.id, status: a.status, duration: a.duration });
      }
    }
    if (data.length < 100) break;
    page++;
  }
  return mapa;
}

function dur(s?: number | null) {
  if (!s) return "—";
  return s < 60 ? `${Math.round(s)}s` : `${Math.round(s / 60)}min`;
}

async function main() {
  const alvo = Number(process.argv[2] ?? 1);
  const mux = await playbacksDoMux();

  const curso = await prisma.course.findUnique({
    where: { slug: SLUG },
    select: {
      modules: {
        orderBy: { order: "asc" },
        select: {
          title: true, order: true, releaseDate: true,
          topics: { orderBy: { order: "asc" }, select: { id: true, title: true, order: true, apostilaUrl: true } },
          lessons: {
            orderBy: [{ topicId: "asc" }, { order: "asc" }],
            select: {
              title: true, order: true, duration: true, topicId: true,
              muxAssetId: true, muxPlaybackId: true, videoUrl: true,
              instructors: { select: { instructor: { select: { user: { select: { name: true } } } } } },
            },
          },
        },
      },
    },
  });
  const mod = curso?.modules.find((m) => m.order === alvo);
  if (!mod) throw new Error(`Módulo ${alvo} não encontrado`);

  console.log(`MÓDULO ${mod.order}: ${mod.title}`);
  console.log(`Liberação para os alunos: ${mod.releaseDate?.toLocaleDateString("pt-BR") ?? "imediata"}\n`);

  const quebradas: string[] = [];
  const semVideo: string[] = [];
  const suspeitas: string[] = [];

  const grupos = [...mod.topics.map((t) => ({ t, aulas: mod.lessons.filter((l) => l.topicId === t.id) })),
                  { t: null, aulas: mod.lessons.filter((l) => !l.topicId) }];

  for (const { t, aulas } of grupos) {
    if (!aulas.length && t) { console.log(`${t.order}. ${t.title}  — SEM AULAS\n`); continue; }
    if (!aulas.length) continue;
    console.log(t ? `${t.order}. ${t.title}${t.apostilaUrl ? "" : "   [sem apostila]"}` : "(aulas sem tópico)");

    for (const l of aulas) {
      const no = mux.get(l.muxPlaybackId ?? "");
      let estado: string;
      if (l.muxPlaybackId && no) estado = `ok ${no.status} ${dur(no.duration)}`;
      else if (l.muxPlaybackId && !no) { estado = "QUEBRADO — playbackId não existe no Mux"; quebradas.push(`${t?.title ?? "-"} > ${l.title}`); }
      else if (l.videoUrl) estado = "link externo";
      else { estado = "SEM VÍDEO"; semVideo.push(`${t?.title ?? "-"} > ${l.title}`); }

      if (no && no.duration && no.duration < 120) suspeitas.push(`${l.title} (${dur(no.duration)} no Mux)`);
      console.log(`   ${String(l.order).padStart(2)}. ${l.title.trim().slice(0, 46).padEnd(46)} ${estado}`);
    }
    console.log("");
  }

  console.log("=".repeat(72));
  console.log(`Aulas no módulo: ${mod.lessons.length}`);
  console.log(`  com vídeo que toca de verdade ..... ${mod.lessons.length - quebradas.length - semVideo.length}`);
  console.log(`  com playbackId QUEBRADO ........... ${quebradas.length}`);
  console.log(`  sem vídeo nenhum .................. ${semVideo.length}`);
  console.log(`  aulas apontando para asset (campo muxAssetId preenchido): ${mod.lessons.filter((l) => l.muxAssetId).length}`);

  if (quebradas.length) {
    console.log(`\nQUEBRADAS — o aluno abre e não toca:`);
    for (const q of quebradas) console.log(`  - ${q}`);
  }
  if (semVideo.length) {
    console.log(`\nSEM VÍDEO:`);
    for (const s of semVideo) console.log(`  - ${s}`);
  }
  if (suspeitas.length) {
    console.log(`\nVÍDEOS MUITO CURTOS (menos de 2 min — parecem teste):`);
    for (const s of suspeitas) console.log(`  - ${s}`);
  }

  // Lesson.duration é gravado em MINUTOS (o player formata com
  // `if (mins < 60) return "${mins}min"`); o Mux devolve segundos.
  console.log(`\nDURAÇÃO (campo em minutos) x duração real do vídeo no Mux`);
  const semDuracao: string[] = [];
  let divergentes = 0;
  for (const l of mod.lessons) {
    const no = mux.get(l.muxPlaybackId ?? "");
    if (!no?.duration) continue;
    const realMin = Math.round(no.duration / 60);
    if (l.duration == null) { semDuracao.push(`${l.title.trim()} (vídeo tem ${realMin}min)`); continue; }
    if (Math.abs(l.duration - realMin) > 2) {
      divergentes++;
      console.log(`  ! ${l.title.trim().slice(0, 44).padEnd(44)} banco: ${l.duration}min   Mux: ${realMin}min`);
    }
  }
  const comVideo = mod.lessons.filter((l) => mux.get(l.muxPlaybackId ?? "")).length;
  console.log(`  conferem: ${comVideo - divergentes - semDuracao.length}/${comVideo}   divergentes: ${divergentes}   em branco: ${semDuracao.length}`);
  if (semDuracao.length) {
    console.log(`\nSEM DURAÇÃO PREENCHIDA (o aluno não vê quanto tempo dura):`);
    for (const s of semDuracao) console.log(`  - ${s}`);
  }
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
