import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { audiocastSrc } from "@/lib/audiocast";

/**
 * O Google Drive devolve os arquivos com Cross-Origin-Resource-Policy:
 * same-site, então o navegador recusa tocá-los num <audio> de outro domínio —
 * não existe forma de link que contorne isso. Quem busca aqui é o servidor,
 * que não aplica política de origem, e repassa o áudio como se fosse nosso.
 *
 * De quebra o AudioCast passa a exigir matrícula, como as referências.
 *
 * Espelha /api/references/[id]. Quando os áudios saírem do Drive, só a origem
 * do fetch muda: a página continua apontando para cá.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { lessonId } = await params;
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { audioUrl: true, module: { select: { courseId: true } } },
  });
  if (!lesson?.audioUrl) return NextResponse.json({ error: "Áudio não encontrado." }, { status: 404 });

  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "INSTRUCTOR" && role !== "EDITOR") {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: lesson.module.courseId } },
    });
    if (!enrollment || (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED")) {
      return NextResponse.json({ error: "Você não está matriculado neste curso." }, { status: 403 });
    }
  }

  // O player pede o arquivo em faixas — o Safari do iOS não toca sem isso.
  const range = req.headers.get("range");
  const upstream = await fetch(audiocastSrc(lesson.audioUrl), {
    headers: range ? { Range: range } : {},
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Não foi possível carregar o áudio." }, { status: 502 });
  }

  const headers = new Headers({
    "Content-Type": upstream.headers.get("content-type") ?? "audio/mpeg",
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
  });
  for (const h of ["content-length", "content-range"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }

  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
