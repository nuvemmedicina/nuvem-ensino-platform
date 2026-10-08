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
        <div className="w-full">
          <div className="relative w-full rounded-xl overflow-hidden border border-border bg-background"
               style={{ aspectRatio: aspectHint.replace(":", "/") }}>
            <Image src={url} alt={label} fill className="object-cover" unoptimized />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 text-white">
                <Loader2 className="w-5 h-5 animate-spin" /><span className="font-sans text-xs">Enviando…</span>
              </div>
            )}
          </div>
          {/* Sempre visíveis: o "aparecer ao passar o mouse" não funcionava em
              telas sensíveis ao toque, e a Ana não achava como trocar. */}
          <div className="flex items-center gap-2 mt-2">
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
              className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-foreground hover:border-primary/40 transition-colors disabled:opacity-60">
              <ImagePlus className="w-3.5 h-3.5" /> Trocar imagem
            </button>
            <button type="button" onClick={() => setUrl("")} disabled={uploading}
              className="inline-flex items-center gap-1.5 font-sans text-xs px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60">
              <X className="w-3.5 h-3.5" /> Remover
            </button>
            <span className="font-sans text-[11px] text-muted">Depois, clique em salvar no fim do formulário.</span>
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
