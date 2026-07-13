"use client";

import { useState, useRef } from "react";
import { FileText, Trash2, Upload, Loader2, Plus, X, ExternalLink } from "lucide-react";

type Ref = { id: string; title: string; fileUrl: string; fileSize: number | null };

function formatBytes(b: number | null) {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReferencesManager({ courseSlug, initial }: { courseSlug: string; initial: Ref[] }) {
  const [refs, setRefs] = useState<Ref[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const selectedFile = useRef<File | null>(null);

  async function handleUpload() {
    const file = selectedFile.current;
    if (!file || !title.trim()) { setError("Preencha o título e selecione um arquivo"); return; }
    setUploading(true);
    setError(null);
    try {
      // 1. Pedir URL pré-assinada
      const res = await fetch("/api/upload/r2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, fileSize: file.size }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao obter URL de upload");
      const { uploadUrl, publicUrl } = await res.json();

      // 2. Upload direto para o R2
      const upload = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!upload.ok) throw new Error("Falha no upload para o R2");

      // 3. Salvar referência no banco
      const save = await fetch(`/api/admin/courses/${courseSlug}/references`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), fileUrl: publicUrl, fileSize: file.size }),
      });
      if (!save.ok) throw new Error((await save.json()).error ?? "Erro ao salvar referência");
      const newRef = await save.json();
      setRefs((prev) => [...prev, newRef]);
      setTitle("");
      selectedFile.current = null;
      if (fileRef.current) fileRef.current.value = "";
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Excluir "${title}"?`)) return;
    await fetch(`/api/admin/courses/${courseSlug}/references/${id}`, { method: "DELETE" });
    setRefs((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-4">
      {/* Lista */}
      {refs.length === 0 && !showForm && (
        <p className="font-sans text-sm text-muted py-2">Nenhuma referência adicionada ainda.</p>
      )}

      {refs.map((ref) => (
        <div key={ref.id} className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3">
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-sans text-sm font-medium text-foreground truncate">{ref.title}</p>
            {ref.fileSize && <p className="font-sans text-xs text-muted">{formatBytes(ref.fileSize)}</p>}
          </div>
          <a href={ref.fileUrl} target="_blank" rel="noopener noreferrer"
            className="p-1.5 text-muted hover:text-primary transition-colors" title="Abrir arquivo">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button onClick={() => handleDelete(ref.id, ref.title)}
            className="p-1.5 text-muted/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Excluir">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {/* Formulário de upload */}
      {showForm && (
        <div className="border border-dashed border-border rounded-xl p-4 space-y-3 bg-surface/50">
          <div className="flex items-center justify-between">
            <p className="font-sans text-sm font-semibold text-foreground">Adicionar referência</p>
            <button onClick={() => { setShowForm(false); setError(null); setTitle(""); selectedFile.current = null; }}
              className="text-muted hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do artigo ou documento"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/50"
          />

          <label className="flex items-center gap-2 cursor-pointer font-sans text-sm text-muted border border-dashed border-border rounded-lg px-3 py-2 hover:border-primary/50 hover:text-foreground transition-colors">
            <Upload className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {selectedFile.current?.name ?? "Selecionar PDF ou documento"}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.doc,.pptx,.xlsx,.txt"
              className="hidden"
              onChange={(e) => { selectedFile.current = e.target.files?.[0] ?? null; setError(null); }}
            />
          </label>

          {error && (
            <p className="font-sans text-xs text-red-500">{error}</p>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="inline-flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Enviando…" : "Enviar arquivo"}
          </button>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 font-sans text-sm font-medium px-3 py-1.5 rounded-lg border border-dashed border-border hover:border-primary/50 hover:text-primary text-muted transition-colors"
        >
          <Plus className="w-4 h-4" /> Adicionar referência
        </button>
      )}
    </div>
  );
}
