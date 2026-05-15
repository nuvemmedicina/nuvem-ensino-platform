import { NextRequest, NextResponse } from "next/server";
import Mux from "@mux/mux-node";
import { prisma } from "@/lib/prisma";

// Mux envia o payload como JSON com um header de assinatura.
// Verificamos a assinatura com MUX_WEBHOOK_SECRET antes de processar.

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const secret = process.env.MUX_WEBHOOK_SECRET ?? "";

  // Verifica assinatura (evita payloads forjados)
  try {
    Mux.Webhooks.verifySignature(rawBody, req.headers as unknown as Headers, secret);
  } catch {
    console.error("[Mux Webhook] Assinatura inválida");
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as {
    type: string;
    data: {
      id: string; // assetId
      playback_ids?: Array<{ id: string; policy: string }>;
      duration?: number;
    };
  };

  // Só nos interessa quando o asset fica pronto
  if (event.type === "video.asset.ready") {
    const assetId = event.data.id;
    const playbackId = event.data.playback_ids?.find((p) => p.policy === "public")?.id;
    const durationSecs = event.data.duration;

    if (!playbackId) {
      console.warn("[Mux Webhook] Asset pronto mas sem playback_id público", assetId);
      return NextResponse.json({ ok: true });
    }

    // Encontra a aula pelo muxAssetId e atualiza com o playbackId
    await prisma.lesson.updateMany({
      where: { muxAssetId: assetId },
      data: {
        muxPlaybackId: playbackId,
        // Converte segundos → minutos (arredondado para cima)
        ...(durationSecs ? { duration: Math.ceil(durationSecs / 60) } : {}),
      },
    });

    console.log(`[Mux Webhook] Asset ${assetId} pronto → playbackId ${playbackId}`);
  }

  return NextResponse.json({ ok: true });
}
