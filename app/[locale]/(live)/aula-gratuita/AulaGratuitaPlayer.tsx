"use client";

import { useEffect, useRef } from "react";

// Marcos registrados no banco: o bastante para ver quem desistiu cedo e quem
// foi até o fim, sem uma requisição a cada segundo de vídeo.
const MARCOS = [5, 25, 50, 75, 90, 100];

// Só o pedaço da API do YouTube que usamos aqui.
type YTPlayer = { getCurrentTime(): number; getDuration(): number; destroy(): void };
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      width: string;
      height: string;
      playerVars: Record<string, number>;
      events: { onStateChange: (e: { data: number }) => void };
    },
  ) => YTPlayer;
  PlayerState: { PLAYING: number; ENDED: number };
};
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** Carrega a API do YouTube uma vez só, mesmo com o componente remontando. */
function carregarApiYouTube(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return new Promise((resolve) => {
    const anterior = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      anterior?.();
      resolve(window.YT!);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
}

export default function AulaGratuitaPlayer({
  youtubeId,
  leadId,
  titulo,
}: {
  youtubeId: string;
  leadId: string;
  titulo: string;
}) {
  const alvo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const enviados = new Set<number>();
    function registrar(pct: number) {
      const marco = [...MARCOS].reverse().find((m) => pct >= m);
      if (!marco || enviados.has(marco)) return;
      enviados.add(marco);
      fetch("/api/aula-gratuita/progresso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, pct: marco }),
        keepalive: true,
      }).catch(() => {});
    }

    let player: YTPlayer | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let cancelado = false;

    carregarApiYouTube().then((YT) => {
      if (cancelado || !alvo.current) return;
      player = new YT.Player(alvo.current, {
        videoId: youtubeId,
        width: "100%",
        height: "100%",
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.ENDED) registrar(100);
            if (e.data === YT.PlayerState.PLAYING && !timer) {
              // A API não avisa o andamento; consultamos a posição a cada 10 s.
              timer = setInterval(() => {
                const d = player?.getDuration() ?? 0;
                if (d > 0) registrar(((player?.getCurrentTime() ?? 0) / d) * 100);
              }, 10_000);
            }
          },
        },
      });
    });

    return () => {
      cancelado = true;
      if (timer) clearInterval(timer);
      player?.destroy();
    };
  }, [youtubeId, leadId]);

  return (
    <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
      <div ref={alvo} title={titulo} className="h-full w-full" />
    </div>
  );
}
