"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { updateLessonInstructors } from "./actions";

type Instructor = { id: string; name: string | null; title: string | null };

export function LessonInstructorSelector({
  lessonId,
  courseSlug,
  allInstructors,
  initialIds,
}: {
  lessonId: string;
  courseSlug: string;
  allInstructors: Instructor[];
  initialIds: string[];
}) {
  const [selected, setSelected] = useState<string[]>(initialIds);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setSaved(false);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        await updateLessonInstructors(lessonId, courseSlug, selected);
        setSaved(true);
      } catch (e) {
        setError((e as Error).message ?? "Erro ao salvar");
      }
    });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {allInstructors.map((inst) => {
        const isOn = selected.includes(inst.id);
        return (
          <button
            key={inst.id}
            type="button"
            onClick={() => toggle(inst.id)}
            className={`font-sans text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
              isOn
                ? "bg-primary text-white border-primary"
                : "border-border text-muted hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {inst.name ?? inst.title ?? inst.id}
          </button>
        );
      })}
      <button
        type="button"
        onClick={save}
        disabled={isPending}
        className="font-sans text-[11px] font-semibold px-2.5 py-1 rounded-full border border-border text-muted hover:text-foreground transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin inline" /> : saved ? <Check className="w-3 h-3 inline text-green-500" /> : "Salvar"}
      </button>
      {error && <span className="font-sans text-[10px] text-red-500">{error}</span>}
    </div>
  );
}
