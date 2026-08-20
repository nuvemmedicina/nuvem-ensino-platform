import Link from "next/link";
import { Layers } from "lucide-react";
import { moduleColor } from "@/lib/moduleColors";

type TopicoComFlashcards = {
  id: string;
  title: string;
  grupo: { id: string; cards: number } | null;
};

/**
 * Convite a revisar os flashcards do módulo que está com prova aberta —
 * fica antes da prova de propósito, para o aluno reforçar antes de ser
 * avaliado, no mesmo espírito do TreinoPanel.
 */
export function FlashcardsPanel({
  moduleTitle,
  moduleIndex,
  topicos,
}: {
  moduleTitle: string;
  moduleIndex: number;
  topicos: TopicoComFlashcards[];
}) {
  const prontos = topicos.filter(
    (t): t is TopicoComFlashcards & { grupo: { id: string; cards: number } } => t.grupo !== null,
  );
  if (prontos.length === 0) return null;

  const cor = moduleColor(moduleIndex);

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-accent/40 flex items-center justify-center shrink-0">
          <Layers className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">
            Flashcards — {moduleTitle}
          </p>
          <p className="font-sans text-sm text-foreground">Reforce o que você estudou</p>
          <p className="font-sans text-xs text-muted mt-0.5">
            Revise os pontos principais deste módulo, um card por vez — bom para a reta final antes da prova.
          </p>
        </div>
      </div>

      <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {prontos.map((topico) => (
          <Link
            key={topico.id}
            href={`/dashboard/flashcards/${topico.grupo.id}`}
            className="group flex flex-col rounded-xl border border-border bg-background px-3 py-2.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            style={{ borderLeft: `3px solid ${cor.accent}` }}
          >
            <h3 className="font-sans text-[12px] font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {topico.title}
            </h3>
            <p className="font-sans text-[11px] text-muted mt-1">
              {topico.grupo.cards} card{topico.grupo.cards !== 1 ? "s" : ""}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
