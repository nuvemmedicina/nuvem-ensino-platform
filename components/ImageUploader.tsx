"use client";

import { useState, useRef } from "react";
import { upload } from "@vercel/blob/client";
import Image from "next/image";
import { ImagePlus, Loader2, X, AlertCircle, Link as LinkIcon } from "lucide-react";

type Props = {
  name: string;
  initialUrl?: string | null;
  folder: "instructors" | "courses" | string;
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
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputVal, setUrlInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const blob = await upload(filename, file, {
        access: "public",
        handleUploadUrl: "/api/upload/image",
        contentType: file.type,
      });
      setUrl(blob.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no upload");
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
      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="relative group w-full">
          <div className="relative w-full rounded-xl overflow-hidden border border-border bg-background"
               style={{ aspectRatio: aspectHint.replace(":", "/") }}>
            <Image src={url} alt={label} fill className="object-cover" unoptimized />
          </div>
          <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button type="button" onClick={() => inputRef.current?.click()}
              className="font-sans text-xs font-semibold px-3 py-1.5 rounded-lg bg-white text-foreground hover:bg-white/90 transition-colors">
              Trocar
            </button>
            <button type="button" onClick={() => setUrl("")}
              className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors" title="Remover imagem">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
          disabled={uploading}
          className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted cursor-pointer disabled:opacity-60">
          {uploading ? (
            <><Loader2 className="w-6 h-6 animate-spin text-primary" /><span className="font-sans text-xs">Enviando…</span></>
          ) : (
            <>
              <ImagePlus className="w-6 h-6" />
              <span className="font-sans text-xs font-medium">Clique ou arraste uma imagem</span>
              <span className="font-sans text-[10px] text-muted/60">JPG, PNG ou WEBP · máx. 10 MB</span>
              {aspectHint && <span className="font-sans text-[10px] text-muted/50">Proporção ideal: {aspectHint}</span>}
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

      {!url && (
        <div className="mt-2">
          {!showUrlInput ? (
            <button type="button" onClick={() => setShowUrlInput(true)}
              className="flex items-center gap-1.5 font-sans text-xs text-muted hover:text-foreground transition-colors">
              <LinkIcon className="w-3 h-3" /> Ou cole uma URL de imagem
            </button>
          ) : (
            <div className="flex gap-2">
              <input type="url" value={urlInputVal} onChange={(e) => setUrlInputVal(e.target.value)}
                placeholder="https://..." className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:border-primary/50" />
              <button type="button" onClick={() => { if (urlInputVal.trim()) { setUrl(urlInputVal.trim()); setShowUrlInput(false); setUrlInputVal(""); } }}
                className="font-sans text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors">
                Usar
              </button>
              <button type="button" onClick={() => { setShowUrlInput(false); setUrlInputVal(""); }}
                className="font-sans text-xs px-2 py-1.5 rounded-lg border border-border text-muted hover:text-foreground transition-colors">
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
        onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); e.target.value = ""; }} />
    </div>
  );
}
