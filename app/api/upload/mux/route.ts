import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { mux } from "@/lib/mux";
import { prisma } from "@/lib/prisma";

// POST /api/upload/mux
// Body: { lessonId: string }
// Returns: { uploadId, uploadUrl }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { lessonId } = await req.json();
  if (!lessonId) {
    return NextResponse.json({ error: "lessonId é obrigatório" }, { status: 400 });
  }

  // Confirma que a aula existe
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) {
    return NextResponse.json({ error: "Aula não encontrada" }, { status: 404 });
  }

  // Cria um upload direto no Mux
  const client = mux();
  const upload = await client.video.uploads.create({
    cors_origin: process.env.NEXT_PUBLIC_APP_URL ?? "*",
    new_asset_settings: {
      playback_policy: ["public"],
      encoding_tier: "baseline", // mais barato; troque por "smart" se quiser qualidade adaptativa
    },
  });

  return NextResponse.json({
    uploadId: upload.id,
    uploadUrl: upload.url,
  });
}

// GET /api/upload/mux?uploadId=xxx
// Consulta o status de um upload e retorna o assetId quando pronto
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const uploadId = req.nextUrl.searchParams.get("uploadId");
  if (!uploadId) {
    return NextResponse.json({ error: "uploadId é obrigatório" }, { status: 400 });
  }

  const client = mux();
  const upload = await client.video.uploads.retrieve(uploadId);

  return NextResponse.json({
    status: upload.status,
    assetId: upload.asset_id ?? null,
  });
}

// PATCH /api/upload/mux
// Body: { lessonId, muxAssetId }
// Salva o muxAssetId na aula (o playbackId chegará via webhook)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { lessonId, muxAssetId } = await req.json();
  if (!lessonId || !muxAssetId) {
    return NextResponse.json({ error: "lessonId e muxAssetId são obrigatórios" }, { status: 400 });
  }

  await prisma.lesson.update({
    where: { id: lessonId },
    data: { muxAssetId },
  });

  return NextResponse.json({ ok: true });
}
