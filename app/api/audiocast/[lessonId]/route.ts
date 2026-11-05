import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { audiocastSrc, audioDoVideoSrc } from "@/lib/audiocast";

/**
 * O Google Drive devolve os arquivos com Cross-Origin-Resource-Policy:
 * same-site, então o navegador recusa tocá-los num <audio> de outro domínio —
 * não existe forma de link que contorne isso. Quem busca aqui é o servidor,
 * que não aplica política de origem, e repassa o áudio como se fosse nosso.
 *
 * De quebra o AudioCast passa a exigir matrícula, como as referências.
 *
 * Espelha /api/references/[id].
 *
 * Fonte do áudio, em ordem: o áudio do próprio vídeo, gerado pelo Mux (ver
 * audioDoVideoSrc), e, se ele ainda não existir, o arquivo cadastrado no Drive.
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
    select: { audioUrl: true, muxPlaybackId: true, module: { select: { courseId: true } } },
  });
  const fontes = [
    lesson?.muxPlaybackId ? audioDoVideoSrc(lesson.muxPlaybackId) : null,
    lesson?.audioUrl ? audiocastSrc(lesson.audioUrl) : null,
  ].filter((f): f is string => !!f);
  if (!lesson || fontes.length === 0) return NextResponse.json({ error: "Áudio não encontrado." }, { status: 404 });

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
  // Só passa para a fonte seguinte quando o arquivo não existe (o Mux ainda
  // não gerou o áudio). Outro erro numa fonte que existe não deve misturar
  // pedaços de dois arquivos diferentes no mesmo player.
  let upstream: Response | null = null;
  for (const fonte of fontes) {
    const r = await fetch(fonte, { headers: range ? { Range: range } : {}, cache: "no-store" });
    if (r.status === 404) { await r.body?.cancel(); continue; }
    upstream = r;
    break;
  }

  if (!upstream?.ok || !upstream.body) {
    return NextResponse.json({ error: "Não foi possível carregar o áudio." }, { status: 502 });
  }

  // O Mux responde "audio/m4a", que não é um tipo registrado; o Safari só
  // reconhece o mesmo arquivo como "audio/mp4".
  const tipo = upstream.headers.get("content-type") ?? "audio/mpeg";
  const headers = new Headers({
    "Content-Type": tipo === "audio/m4a" ? "audio/mp4" : tipo,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
  });
  for (const h of ["content-length", "content-range"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }

  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
