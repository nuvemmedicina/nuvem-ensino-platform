import { prisma } from "@/lib/prisma";
import RagIndexClient from "./RagIndexClient";

export default async function RagPage() {
  const courses = await prisma.course.findMany({
    select: { id: true, title: true, slug: true },
    orderBy: { title: "asc" },
  });

  const counts = await prisma.$queryRaw<Array<{ courseId: string; count: bigint }>>`
    SELECT "courseId", COUNT(*) as count FROM "ContentChunk" GROUP BY "courseId"
  `;

  const countMap = Object.fromEntries(counts.map((r) => [r.courseId, Number(r.count)]));

  const coursesWithCount = courses.map((c) => ({
    ...c,
    chunks: countMap[c.id] ?? 0,
  }));

  return <RagIndexClient courses={coursesWithCount} />;
}
