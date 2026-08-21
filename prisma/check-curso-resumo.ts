/** Resumo de um curso: preço, aulas e módulos. Só leitura.
 *  uso: npx tsx prisma/check-curso-resumo.ts <slug>
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const slug = process.argv[2];

async function main() {
  const c = await prisma.course.findUnique({
    where: { slug },
    select: {
      id: true, title: true, slug: true, status: true, category: true, price: true,
      contentUrl: true,
      modules: {
        orderBy: { order: "asc" },
        select: {
          title: true,
          lessons: {
            select: { title: true, type: true, videoUrl: true, muxPlaybackId: true, audioUrl: true, liveUrl: true, content: true },
          },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });
  if (!c) { console.log(`curso "${slug}" não encontrado`); return; }

  console.log(`${c.title}`);
  console.log(`slug: ${c.slug} | ${c.status} | ${c.category} | preço: R$ ${c.price}`);
  console.log(`contentUrl: ${c.contentUrl ?? "—"} | matrículas: ${c._count.enrollments}`);
  const todas = c.modules.flatMap((m) => m.lessons);
  const temMidia = (l: (typeof todas)[number]) =>
    !!(l.videoUrl || l.muxPlaybackId || l.audioUrl || l.liveUrl || l.content);
  console.log(`módulos: ${c.modules.length} | aulas: ${todas.length} | aulas com mídia/conteúdo: ${todas.filter(temMidia).length}`);
  for (const m of c.modules) {
    const ok = m.lessons.filter(temMidia).length;
    console.log(`  • ${m.title} — ${m.lessons.length} aulas, ${ok} com mídia/conteúdo`);
  }
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
