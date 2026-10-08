import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Layers } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { podeEstudarGrupo } from "@/lib/flashcards";
import { moduleColor } from "@/lib/moduleColors";
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
      topic: {
        select: {
          title: true, titleEs: true, titleEn: true,
          module: { select: { id: true, order: true, courseId: true, title: true, titleEs: true, titleEn: true } },
        },
      },
    },
  });
  if (!group) notFound();

  const role = (session.user as { role?: string }).role;
  if (!(await podeEstudarGrupo(session.user.id, role, group.courseId))) {
    redirect("/dashboard/flashcards");
  }

  // Cor do módulo do tema, a mesma da página do curso e da lista de
  // flashcards (posição do módulo no curso). Grupo sem tema fica no petróleo.
  const modulo = group.topic?.module ?? null;
  const posicao = modulo
    ? await prisma.module.count({ where: { courseId: modulo.courseId, order: { lt: modulo.order } } })
    : 0;
  const cor = moduleColor(posicao);
  const nomeModulo = modulo ? traduzirItem(modulo, locale).title.split("—")[0].trim() : null;
  const tituloGrupo = group.topic ? traduzirItem(group.topic, locale).title : group.title;

  if (group.cards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="font-serif text-2xl font-light text-foreground mb-2">{tituloGrupo}</h1>
        <p className="font-sans text-sm text-muted">{t("grupoVazio")}</p>
        <Link href="/dashboard/flashcards" className="inline-block mt-6 font-sans text-sm text-primary hover:underline">
          {t("voltar")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">
      <Link
        href="/dashboard/flashcards"
        className="inline-flex items-center gap-1 font-sans text-sm text-muted hover:text-foreground transition-colors w-fit"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" /> {t("titulo")}
      </Link>

      {/* Faixa do módulo */}
      <header
        className="relative overflow-hidden rounded-3xl px-6 sm:px-8 py-6 text-white"
        style={{ background: `linear-gradient(135deg, ${cor.accent} 0%, color-mix(in srgb, ${cor.accent} 62%, black) 100%)` }}
      >
        <div aria-hidden="true" className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-white/10" />
        <div aria-hidden="true" className="absolute right-16 -bottom-20 w-40 h-40 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {nomeModulo && (
              <span className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full bg-white/15">
                {nomeModulo}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/15">
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
              {t("cards", { n: group.cards.length })}
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium leading-tight text-balance">{tituloGrupo}</h1>
          {group.course && (
            <p className="font-sans text-sm text-white/70">{traduzirItem(group.course, locale).title}</p>
          )}
        </div>
      </header>

      <FlashcardPlayer group={group} userId={session.user.id} cor={cor.accent} tint={cor.tint} />
    </div>
  );
}
