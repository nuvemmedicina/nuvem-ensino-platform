import { prisma } from "@/lib/prisma";
import { Layers } from "lucide-react";
import { CabecalhoAdmin } from "@/components/admin/CabecalhoAdmin";
import { FlashcardsAdminClient } from "./FlashcardsAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminFlashcardsPage() {
  const [groups, courses, defaultDesign] = await Promise.all([
    prisma.flashcardGroup.findMany({
      include: {
        _count: { select: { cards: true } },
        course: { select: { title: true, slug: true, thumbnailUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    // Módulos e tópicos junto: o seletor do modal precisa da árvore inteira
    // para oferecer "Módulo I › Fisiopatologia dos DICI" sem ir buscar depois.
    prisma.course.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true, title: true, slug: true,
        modules: {
          orderBy: { order: "asc" },
          select: {
            id: true, title: true,
            topics: { orderBy: { order: "asc" }, select: { id: true, title: true } },
          },
        },
      },
    }),
    prisma.flashcardDesignConfig.findFirst({ where: { isDefault: true } }),
  ]);

  return (
    <div>
      <CabecalhoAdmin
        titulo="Flashcards"
        subtitulo="Grupos de revisão por tema, na cor de cada módulo."
        icone={Layers}
        destaques={[
          { rotulo: groups.length === 1 ? "grupo" : "grupos", valor: groups.length },
          { rotulo: "cards", valor: groups.reduce((n, g) => n + g._count.cards, 0) },
        ]}
      />
      <FlashcardsAdminClient groups={groups} courses={courses} defaultDesign={defaultDesign} />
    </div>
  );
}
