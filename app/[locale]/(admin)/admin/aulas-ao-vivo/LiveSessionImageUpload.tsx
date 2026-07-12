"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";

export function LiveSessionImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "live-sessions");
      const res = await fetch("/api/upload/image", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro no upload");
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Preview */}
      {value ? (
        <div className="relative w-full rounded-xl overflow-hidden bg-muted/10 border border-border" style={{ aspectRatio: "3/4", maxWidth: 160 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Capa" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            aria-label="Remover imagem"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/5 hover:bg-primary/5 transition-colors py-8 cursor-pointer disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-muted animate-spin" />
          ) : (
            <ImagePlus className="w-6 h-6 text-muted" />
          )}
          <span className="font-sans text-xs text-muted">
            {uploading ? "Enviando…" : "Clique para fazer upload"}
          </span>
          <span className="font-sans text-[10px] text-muted/60">JPG, PNG ou WEBP · máx 5 MB</span>
        </button>
      )}

      {/* URL manual */}
      <input
        type="url"
        placeholder="ou cole a URL aqui..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50"
      />

      {error && <p className="font-sans text-[10px] text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
