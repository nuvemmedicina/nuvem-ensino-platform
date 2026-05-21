"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X, AlertCircle } from "lucide-react";

type Props = {
  /** name of the hidden input that stores the final URL */
  name: string;
  /** initial URL already saved in DB */
  initialUrl?: string | null;
  /** Vercel Blob folder: "instructors" or "courses" */
  folder: "instructors" | "courses";
  /** aspect ratio hint shown in the drop-zone */
  aspectHint?: string;
  label?: string;
};

export function ImageUploader({
  name,
  initialUrl,
  folder,
  aspectHint = "1:1",
  label = "Imagem",
}: Props) {
  const [url, setUrl] = useState<string>(initialUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);

      const res = await fetch("/api/upload/image", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Erro ao fazer upload.");
      setUrl(data.url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      {/* Hidden input stores the URL that gets submitted with the form */}
      <input type="hidden" name={name} value={url} />

      {url ? (
        /* Preview */
        <div className="relative group w-full">
          <div className="relative w-full rounded-xl overflow-hidden border border-border bg-background"
               style={{ aspectRatio: aspectHint.replace(":", "/") }}>
            <Image
              src={url}
              alt={label}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          {/* Overlay on hover: trocar ou remover */}
          <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-sans text-xs font-semibold px-3 py-1.5 rounded-lg bg-white text-foreground hover:bg-white/90 transition-colors"
            >
              Trocar
            </button>
            <button
              type="button"
              onClick={() => setUrl("")}
              className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              title="Remover imagem"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Drop zone */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          disabled={uploading}
          className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted cursor-pointer disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="font-sans text-xs">Enviando…</span>
            </>
          ) : (
            <>
              <ImagePlus className="w-6 h-6" />
              <span className="font-sans text-xs font-medium">Clique ou arraste uma imagem</span>
              <span className="font-sans text-[10px] text-muted/60">JPG, PNG ou WEBP · máx. 5 MB</span>
              {aspectHint && (
                <span className="font-sans text-[10px] text-muted/50">Proporção ideal: {aspectHint}</span>
              )}
            </>
          )}
        </button>
      )}

      {error && (
        <div className="flex items-center gap-2 mt-2 text-red-500">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="font-sans text-xs">{error}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
