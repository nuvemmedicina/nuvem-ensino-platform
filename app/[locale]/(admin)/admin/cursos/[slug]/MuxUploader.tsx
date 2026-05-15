"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle, Loader2, AlertCircle, X } from "lucide-react";

type Props = {
  lessonId: string;
};

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number }
  | { status: "processing" }
  | { status: "ready"; assetId: string }
  | { status: "error"; message: string };

export function MuxUploader({ lessonId }: Props) {
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("video/")) {
      setState({ status: "error", message: "Selecione um arquivo de vídeo." });
      return;
    }

    setState({ status: "uploading", progress: 0 });

    try {
      // 1. Solicita uma URL de upload direto ao Mux
      const res = await fetch("/api/upload/mux", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erro ao criar upload");
      }

      const { uploadId, uploadUrl } = await res.json();

      // 2. Upload direto do arquivo para o Mux via XMLHttpRequest (suporta progresso)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setState({ status: "uploading", progress: pct });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload falhou: HTTP ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Erro de rede durante o upload"));
        xhr.send(file);
      });

      setState({ status: "processing" });

      // 3. Polling até o Mux processar o vídeo (máx. 5 min)
      const assetId = await pollUpload(uploadId);

      // Salva muxAssetId na aula via API (playbackId chegará via webhook Mux)
      await fetch("/api/upload/mux", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, muxAssetId: assetId }),
      });

      setState({ status: "ready", assetId });
    } catch (err) {
      setState({ status: "error", message: (err as Error).message });
    }
  }

  async function pollUpload(uploadId: string, attempts = 0): Promise<string> {
    if (attempts > 60) throw new Error("Timeout: o Mux demorou demais para processar o vídeo.");
    await new Promise((r) => setTimeout(r, 5000));

    const res = await fetch(`/api/upload/mux?uploadId=${uploadId}`);
    const data = await res.json();

    if (data.status === "asset_created" && data.assetId) return data.assetId;
    return pollUpload(uploadId, attempts + 1);
  }

  return (
    <div className="mt-2">
      {/* Drop zone */}
      {state.status === "idle" && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center gap-2 py-4 border-2 border-dashed border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted cursor-pointer"
        >
          <Upload className="w-5 h-5" />
          <span className="font-sans text-xs">Clique para enviar vídeo via Mux</span>
          <span className="font-sans text-[10px] text-muted/60">MP4, MOV, MKV · qualquer tamanho</span>
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </button>
      )}

      {/* Uploading */}
      {state.status === "uploading" && (
        <div className="flex flex-col gap-2 py-3">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs text-muted">Enviando para Mux…</span>
            <span className="font-sans text-xs font-semibold text-primary">{state.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Processing */}
      {state.status === "processing" && (
        <div className="flex items-center gap-2 py-3 text-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="font-sans text-xs">Mux está processando o vídeo… (pode levar alguns minutos)</span>
        </div>
      )}

      {/* Ready */}
      {state.status === "ready" && (
        <div className="flex items-center gap-2 py-3 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="font-sans text-xs font-semibold">
            Vídeo processado com sucesso! O player será ativado automaticamente.
          </span>
        </div>
      )}

      {/* Error */}
      {state.status === "error" && (
        <div className="flex items-center justify-between gap-2 py-3">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-sans text-xs">{state.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setState({ status: "idle" })}
            className="text-muted hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
