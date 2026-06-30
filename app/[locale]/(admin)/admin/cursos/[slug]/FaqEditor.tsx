"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, GripVertical, Loader2, Check } from "lucide-react";
import { updateCourseFaq } from "./actions";

type Item = { q: string; a: string };

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50";

export function FaqEditor({
  courseId,
  slug,
  initial,
}: {
  courseId: string;
  slug: string;
  initial: Item[];
}) {
  const [items, setItems] = useState<Item[]>(initial);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function add() {
    setItems((prev) => [...prev, { q: "", a: "" }]);
    setSaved(false);
  }

  function remove(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
    setSaved(false);
  }

  function update(i: number, field: "q" | "a", value: string) {
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
    setSaved(false);
  }

  function save() {
    startTransition(async () => {
      await updateCourseFaq(courseId, slug, items.filter((it) => it.q.trim()));
      setSaved(true);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 && (
        <p className="font-sans text-sm text-muted text-center py-4">
          Nenhuma pergunta ainda. Clique em "Adicionar" para criar.
        </p>
      )}

      {items.map((item, i) => (
        <div key={i} className="flex gap-3 items-start border border-border rounded-xl p-4 bg-background">
          <GripVertical className="w-4 h-4 text-muted/40 mt-2.5 shrink-0" />
          <div className="flex-1 space-y-2">
            <input
              value={item.q}
              onChange={(e) => update(i, "q", e.target.value)}
              placeholder="Pergunta"
              className={inputClass}
            />
            <textarea
              value={item.a}
              onChange={(e) => update(i, "a", e.target.value)}
              placeholder="Resposta"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
          <button
            onClick={() => remove(i)}
            className="mt-2 p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button
          onClick={add}
          className="flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2 rounded-lg border border-border text-muted hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar pergunta
        </button>

        <button
          onClick={save}
          disabled={isPending}
          className="flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-60 transition-colors"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : null}
          {saved ? "Salvo!" : "Salvar FAQ"}
        </button>
      </div>

      {items.length > 0 && (
        <p className="font-sans text-xs text-muted">
          Estas perguntas substituem as padrões na página pública do curso. Deixe vazio para usar as perguntas padrão.
        </p>
      )}
    </div>
  );
}
