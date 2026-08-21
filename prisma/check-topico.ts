/**
 * Detalhe completo de um tópico: campo a campo, o que cada aula tem e não tem.
 * Só leitura.
 *
 *   npx tsx prisma/check-topico.ts "Abordagem Clínica"
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const auth = Buffer.from(`${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`).toString("base64");

async function muxPlaybacks() {
  const mapa = new Map<string, { status: string; duration?: number }>();
  const r = await fetch("https://api.mux.com/video/v1/assets?limit=100", { headers: { Authorization: `Basic ${auth}` } });
  const { data } = await r.json();
  for (const a of data) for (const p of a.playback_ids ?? []) mapa.set(p.id, { status: a.status, duration: a.duration });
  return mapa;
}

const sim = (v: unknown) => (v ? "sim" : "—");

async function main() {
  const busca = process.argv[2] ?? "Abordagem Clínica";
  const mux = await muxPlaybacks();

  const topico = await prisma.topic.findFirst({
    where: { title: { contains: busca, mode: "insensitive" } },
    select: {
      title: true, order: true, description: true, apostilaUrl: true,
      module: { select: { title: true, order: true } },
      lessons: {
        orderBy: { order: "asc" },
        select: {
          title: true, order: true, type: true, description: true, content: true,
          duration: true, isFree: true, videoUrl: true, audioUrl: true,
          muxAssetId: true, muxPlaybackId: true, liveUrl: true, liveDate: true,
          createdAt: true, updatedAt: true,
          materials: { select: { title: true, fileType: true } },
          quiz: { select: { title: true, questions: { select: { id: true } } } },
          instructors: { select: { instructor: { select: { user: { select: { name: true } } } } } },
        },
      },
    },
  });
  if (!topico) throw new Error(`Tópico não encontrado: ${busca}`);

  console.log(`Módulo ${topico.module.order}: ${topico.module.title}`);
  console.log(`Tópico ${topico.order}: ${topico.title}`);
  console.log(`  descrição: ${topico.description ? "sim" : "— FALTA"}`);
  console.log(`  apostila:  ${topico.apostilaUrl ? topico.apostilaUrl : "— FALTA"}`);

  for (const l of topico.lessons) {
    const no = mux.get(l.muxPlaybackId ?? "");
    console.log(`\n${"─".repeat(70)}`);
    console.log(`AULA ${l.order}: ${l.title.trim()}`);
    console.log(`  tipo ................ ${l.type}`);
    console.log(`  vídeo ............... ${no ? `Mux ${no.status}, ${Math.round((no.duration ?? 0) / 60)}min` : l.videoUrl ? `link: ${l.videoUrl}` : "— FALTA"}`);
    console.log(`  duração no banco .... ${l.duration != null ? `${l.duration}min` : "— FALTA"}`);
    console.log(`  descrição ........... ${l.description ? `sim (${l.description.length} car.)` : "— falta"}`);
    console.log(`  conteúdo em texto ... ${l.content ? `sim (${l.content.length} car.)` : "—"}`);
    console.log(`  áudio (AudioCast) ... ${sim(l.audioUrl)}`);
    console.log(`  materiais ........... ${l.materials.length ? l.materials.map((m) => `${m.title} (${m.fileType})`).join(", ") : "— nenhum"}`);
    console.log(`  quiz ................ ${l.quiz ? `${l.quiz.title} — ${l.quiz.questions.length} questões` : "— nenhum"}`);
    console.log(`  docentes ............ ${l.instructors.map((i) => i.instructor.user.name).join(", ") || "— NENHUM"}`);
    console.log(`  aula ao vivo ........ ${l.liveDate ? `${l.liveDate.toLocaleString("pt-BR")} ${l.liveUrl ?? "(sem link)"}` : "—"}`);
    console.log(`  gratuita ............ ${l.isFree ? "sim" : "não"}`);
    console.log(`  criada .............. ${l.createdAt.toLocaleString("pt-BR")}   última edição: ${l.updatedAt.toLocaleString("pt-BR")}`);
  }
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
