"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Upload, Trash2, ExternalLink, Loader2 } from "lucide-react";

type Props = {
  moduleId: string;
  courseSlug: string;
  currentUrl: string | null;
  updateAction: (moduleId: string, courseSlug: string, url: string | null) => Promise<void>;
};

export function ApostilaUploader({ moduleId, courseSlug, currentUrl, updateAction }: Props) {
  const [url, setUrl] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") {
      setError("Apenas arquivos PDF são permitidos.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "apostilas");
      const res = await fetch("/api/upload/pdf", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro no upload");
      const newUrl: string = data.url;
      setUrl(newUrl);
      startTransition(() => updateAction(moduleId, courseSlug, newUrl));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setUrl(null);
    startTransition(() => updateAction(moduleId, courseSlug, null));
  }

  const busy = uploading || isPending;

  return (
    <div className="mt-3">
      <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">
        Apostila (PDF)
      </p>

      {url ? (
        <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2">
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 font-sans text-xs text-primary hover:underline truncate"
          >
            Ver apostila
            <ExternalLink className="inline w-3 h-3 ml-1 opacity-60" />
          </a>
          <button
            onClick={handleRemove}
            disabled={busy}
            className="shrink-0 text-muted hover:text-red-500 transition-colors disabled:opacity-40"
            title="Remover apostila"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-border rounded-lg px-4 py-3 font-sans text-xs text-muted hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-40"
        >
          {busy ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...</>
          ) : (
            <><Upload className="w-3.5 h-3.5" /> Fazer upload do PDF</>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />

      {error && <p className="font-sans text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
