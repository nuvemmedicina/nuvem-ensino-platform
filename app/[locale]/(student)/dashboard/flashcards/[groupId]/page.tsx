import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { podeEstudarGrupo } from "@/lib/flashcards";
import { FlashcardPlayer } from "./FlashcardPlayer";
import { getTranslations } from "next-intl/server";
import { traduzirItem } from "@/lib/i18n-content";

export default async function FlashcardStudyPage({
  params,
}: {
  params: Promise<{ groupId: string; locale: string }>;
}) {
  const { groupId, locale } = await params;
  const t = await getTranslations({ locale, namespace: "novaArea.paginas.flashcards" });

  const session = await auth();
  if (!session?.user?.id) redirect(`/entrar?callbackUrl=/dashboard/flashcards/${groupId}`);

  const group = await prisma.flashcardGroup.findUnique({
    where: { id: groupId },
    include: {
      cards: { orderBy: { order: "asc" }, select: { id: true, front: true, back: true } },
      designConfig: true,
      course: { select: { title: true, titleEs: true, titleEn: true } },
    },
  });
  if (!group) notFound();

  const role = (session.user as { role?: string }).role;
  if (!(await podeEstudarGrupo(session.user.id, role, group.courseId))) {
    redirect("/dashboard/flashcards");
  }

  if (group.cards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="font-serif text-2xl font-light text-foreground mb-2">{group.title}</h1>
        <p className="font-sans text-sm text-muted">{t("grupoVazio")}</p>
        <Link href="/dashboard/flashcards" className="inline-block mt-6 font-sans text-sm text-primary hover:underline">
          {t("voltar")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link
        href="/dashboard/flashcards"
        className="inline-flex items-center gap-1 font-sans text-xs text-muted hover:text-foreground transition-colors mb-4"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> {t("titulo")}
      </Link>

      <h1 className="font-serif text-2xl font-light text-foreground">{group.title}</h1>
      {group.course && (
        <p className="font-sans text-xs text-muted mt-1 mb-6">{traduzirItem(group.course, locale).title}</p>
      )}

      <FlashcardPlayer group={group} userId={session.user.id} />
    </div>
  );
}
