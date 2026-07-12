import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { FlashcardPlayer } from "./FlashcardPlayer";

export const dynamic = "force-dynamic";

export default async function FlashcardStudyPage({
  params,
}: {
  params: Promise<{ groupId: string; locale: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { groupId } = await params;

  const group = await prisma.flashcardGroup.findUnique({
    where: { id: groupId },
    include: {
      cards: { orderBy: { order: "asc" } },
      designConfig: true,
    },
  });

  if (!group) notFound();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <FlashcardPlayer group={group} userId={session.user.id} />
    </div>
  );
}
