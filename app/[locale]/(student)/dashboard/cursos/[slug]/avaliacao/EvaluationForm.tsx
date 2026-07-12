"use client";

import { useState, useTransition } from "react";
import { Star, CheckCircle, Loader2 } from "lucide-react";

type ExistingEvaluation = {
  overallRating: number;
  contentRating: number;
  instructorRating: number;
  platformRating: number;
  wouldRecommend: boolean;
  highlight: string | null;
  suggestion: string | null;
} | null;

type Props = {
  action: (formData: FormData) => Promise<void>;
  existing: ExistingEvaluation;
  courseSlug: string;
};

function StarRating({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: number;
}) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(defaultValue ?? 0);

  return (
    <div className="flex flex-col gap-2">
      <label className="font-sans text-sm font-medium text-foreground">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setSelected(star)}
            className="transition-transform hover:scale-110 focus:outline-none"
            aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
          >
            <Star
              className="w-7 h-7 transition-colors"
              fill={(hovered || selected) >= star ? "#f59e0b" : "none"}
              stroke={(hovered || selected) >= star ? "#f59e0b" : "currentColor"}
              strokeWidth={1.5}
              style={{ color: (hovered || selected) >= star ? "#f59e0b" : "var(--color-border)" }}
            />
          </button>
        ))}
      </div>
      <input type="hidden" name={name} value={selected} />
    </div>
  );
}

const LABELS: Record<string, string[]> = {
  overallRating:    ["Péssimo", "Ruim", "Regular", "Bom", "Excelente"],
  contentRating:    ["Péssimo", "Ruim", "Regular", "Bom", "Excelente"],
  instructorRating: ["Péssimo", "Ruim", "Regular", "Bom", "Excelente"],
  platformRating:   ["Péssimo", "Ruim", "Regular", "Bom", "Excelente"],
};

function StarRatingWithLabel({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: number;
}) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(defaultValue ?? 0);
  const active = hovered || selected;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="font-sans text-sm font-medium text-foreground">{label}</label>
        {active > 0 && (
          <span className="font-sans text-xs text-amber-600 font-semibold">
            {LABELS[name]?.[active - 1]}
          </span>
        )}
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setSelected(star)}
            className="transition-transform hover:scale-110 focus:outline-none"
            aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
          >
            <Star
              className="w-7 h-7 transition-colors"
              fill={active >= star ? "#f59e0b" : "none"}
              stroke={active >= star ? "#f59e0b" : "currentColor"}
              strokeWidth={1.5}
              style={{ color: active >= star ? "#f59e0b" : "var(--color-border)" }}
            />
          </button>
        ))}
      </div>
      <input type="hidden" name={name} value={selected} />
    </div>
  );
}

export function EvaluationForm({ action, existing, courseSlug }: Props) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [recommend, setRecommend] = useState<boolean>(existing?.wouldRecommend ?? true);
  const [error, setError] = useState<string | null>(null);

  if (done || (existing && !done)) {
    // If already submitted this session OR has prior evaluation, show success
    if (done) {
      return (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-medium text-foreground mb-1">
              Obrigada pelo seu feedback!
            </h2>
            <p className="font-sans text-sm text-muted">
              Sua avaliação foi registrada com sucesso.
            </p>
          </div>
        </div>
      );
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Validate all ratings filled
    for (const field of ["overallRating", "contentRating", "instructorRating", "platformRating"]) {
      if (!formData.get(field) || Number(formData.get(field)) === 0) {
        setError("Por favor, preencha todas as notas antes de enviar.");
        return;
      }
    }
    setError(null);

    startTransition(async () => {
      try {
        await action(formData);
        setDone(true);
      } catch {
        setError("Ocorreu um erro. Tente novamente.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Se já avaliou, mostra banner */}
      {existing && (
        <div className="flex items-start gap-3 bg-primary/8 border border-primary/20 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="font-sans text-sm text-primary/90">
            Você já avaliou este curso. Pode atualizar sua avaliação abaixo.
          </p>
        </div>
      )}

      {/* Notas */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-6">
        <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted">Notas</h2>

        <StarRatingWithLabel
          name="overallRating"
          label="Avaliação geral do curso"
          defaultValue={existing?.overallRating}
        />
        <div className="h-px bg-border" />
        <StarRatingWithLabel
          name="contentRating"
          label="Qualidade do conteúdo"
          defaultValue={existing?.contentRating}
        />
        <div className="h-px bg-border" />
        <StarRatingWithLabel
          name="instructorRating"
          label="Qualidade dos instrutores"
          defaultValue={existing?.instructorRating}
        />
        <div className="h-px bg-border" />
        <StarRatingWithLabel
          name="platformRating"
          label="Experiência na plataforma"
          defaultValue={existing?.platformRating}
        />
      </div>

      {/* Recomendação */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-4">Recomendação</h2>
        <p className="font-sans text-sm font-medium text-foreground mb-3">
          Você recomendaria este curso para um colega médico?
        </p>
        <input type="hidden" name="wouldRecommend" value={recommend ? "true" : "false"} />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setRecommend(true)}
            className={`flex-1 py-3 rounded-xl font-sans text-sm font-semibold border-2 transition-all ${
              recommend
                ? "border-green-500 bg-green-500/10 text-green-700"
                : "border-border text-muted hover:border-green-500/40"
            }`}
          >
            Sim, com certeza!
          </button>
          <button
            type="button"
            onClick={() => setRecommend(false)}
            className={`flex-1 py-3 rounded-xl font-sans text-sm font-semibold border-2 transition-all ${
              !recommend
                ? "border-red-400 bg-red-400/10 text-red-600"
                : "border-border text-muted hover:border-red-400/40"
            }`}
          >
            Não recomendaria
          </button>
        </div>
      </div>

      {/* Comentários */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-5">
        <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted">Comentários</h2>

        <div>
          <label className="font-sans text-sm font-medium text-foreground block mb-2">
            O que mais gostou no curso?
          </label>
          <textarea
            name="highlight"
            defaultValue={existing?.highlight ?? ""}
            placeholder="Descreva o ponto alto do curso..."
            rows={3}
            className="w-full px-4 py-3 font-sans text-sm text-foreground bg-background border border-border rounded-xl placeholder:text-muted/40 focus:outline-none focus:border-primary/50 resize-none transition-colors"
          />
        </div>

        <div>
          <label className="font-sans text-sm font-medium text-foreground block mb-2">
            Alguma sugestão de melhoria?
          </label>
          <textarea
            name="suggestion"
            defaultValue={existing?.suggestion ?? ""}
            placeholder="Compartilhe suas ideias para tornar o curso ainda melhor..."
            rows={3}
            className="w-full px-4 py-3 font-sans text-sm text-foreground bg-background border border-border rounded-xl placeholder:text-muted/40 focus:outline-none focus:border-primary/50 resize-none transition-colors"
          />
        </div>
      </div>

      {error && (
        <p className="font-sans text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 font-sans text-sm font-semibold py-3.5 rounded-full bg-primary text-white hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:shadow-[0_4px_20px_rgba(0,71,94,0.35)]"
      >
        {isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
        ) : (
          existing ? "Atualizar avaliação" : "Enviar avaliação"
        )}
      </button>
    </form>
  );
}
