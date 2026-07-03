"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X } from "lucide-react";
import { createForumPost } from "./actions";

export function NewPostForm({ courseSlug, courseId }: { courseSlug: string; courseId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError("");
    startTransition(async () => {
      try {
        await createForumPost(courseSlug, courseId, title, content);
        setOpen(false);
        setTitle("");
        setContent("");
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 font-sans text-sm font-semibold px-4 py-3.5 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 hover:text-primary text-muted transition-all"
      >
        <Plus className="w-4 h-4" />
        Iniciar novo tópico
      </button>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-sans text-sm font-semibold text-foreground">Novo tópico</h2>
        <button onClick={() => setOpen(false)} className="text-muted hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Título da sua dúvida ou discussão"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background font-sans text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
        />
        <textarea
          placeholder="Descreva sua dúvida com detalhes…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background font-sans text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
        />
      </div>

      {error && <p className="font-sans text-xs text-red-500 mt-2">{error}</p>}

      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={() => setOpen(false)}
          className="font-sans text-sm text-muted hover:text-foreground px-4 py-2 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending || !title.trim() || !content.trim()}
          className="flex items-center gap-2 font-sans text-sm font-semibold px-5 py-2 rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isPending ? "Publicando…" : "Publicar tópico"}
        </button>
      </div>
    </div>
  );
}
