import { prisma } from "@/lib/prisma";
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
    prisma.course.findMany({ select: { id: true, title: true, slug: true }, orderBy: { title: "asc" } }),
    prisma.flashcardDesignConfig.findFirst({ where: { isDefault: true } }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-light text-foreground">Flashcards</h1>
          <p className="font-sans text-sm text-muted mt-1">{groups.length} grupo{groups.length !== 1 ? "s" : ""} cadastrado{groups.length !== 1 ? "s" : ""}</p>
        </div>
      </div>
      <FlashcardsAdminClient groups={groups} courses={courses} defaultDesign={defaultDesign} />
    </div>
  );
}
