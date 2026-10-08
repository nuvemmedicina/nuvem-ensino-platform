import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { podeEstudarGrupo } from "@/lib/flashcards";
import { getRespiratoryGameProgress } from "./actions";
import { RespiratoryGamePlayer } from "./RespiratoryGamePlayer";
import { traduzirItem } from "@/lib/i18n-content";

export default async function RespiratoryGamePage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect(`/entrar?callbackUrl=/dashboard/cursos/${slug}/jogo`);

  const course = await prisma.course.findFirst({ where: { slug }, select: { id: true, title: true, titleEs: true, titleEn: true } });
  if (!course) notFound();

  const role = (session.user as { role?: string }).role;
  if (!(await podeEstudarGrupo(session.user.id, role, course.id))) {
    redirect(`/dashboard/cursos/${slug}`);
  }

  const progress = await getRespiratoryGameProgress();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link
        href={`/dashboard/cursos/${slug}`}
        className="inline-flex items-center gap-1 font-sans text-xs text-muted hover:text-foreground transition-colors mb-4"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> {traduzirItem(course, locale).title}
      </Link>

      <RespiratoryGamePlayer initialProgress={progress} idiomaPagina={locale} />
    </div>
  );
}
