"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { createForumReply } from "../actions";

export function ReplyForm({ courseSlug, postId }: { courseSlug: string; postId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError("");
    startTransition(async () => {
      try {
        await createForumReply(courseSlug, postId, content);
        setContent("");
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <h3 className="font-sans text-sm font-semibold text-foreground mb-3">Sua resposta</h3>
      <textarea
        placeholder="Escreva sua resposta…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background font-sans text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-colors resize-none mb-3"
      />
      {error && <p className="font-sans text-xs text-red-500 mb-2">{error}</p>}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isPending || !content.trim()}
          className="flex items-center gap-2 font-sans text-sm font-semibold px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {isPending ? "Enviando…" : "Responder"}
        </button>
      </div>
    </div>
  );
}
