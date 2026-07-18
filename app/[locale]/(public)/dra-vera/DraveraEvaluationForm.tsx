"use client";

import { useState, useTransition } from "react";
import { Star, CheckCircle, Loader2 } from "lucide-react";

function StarRating({
  name, label, value, onChange,
}: { name: string; label: string; value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const labels = ["Péssimo", "Ruim", "Regular", "Bom", "Excelente"];
  const active = hovered || value;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="font-sans text-sm font-medium text-foreground">{label}</label>
        {active > 0 && (
          <span className="text-xs font-semibold text-amber-600">{labels[active - 1]}</span>
        )}
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button"
            onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110 focus:outline-none">
            <Star className="w-7 h-7 transition-colors"
              fill={active >= star ? "#f59e0b" : "none"}
              stroke={active >= star ? "#f59e0b" : "var(--color-border)"}
              strokeWidth={1.5} />
          </button>
        ))}
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

export function DraveraEvaluationForm() {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [ratings, setRatings] = useState({ overall: 0, content: 0, didactics: 0, applicability: 0 });

  function setRating(key: keyof typeof ratings) {
    return (v: number) => setRatings((p) => ({ ...p, [key]: v }));
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <div>
          <h2 className="font-serif text-xl font-medium text-foreground mb-1">Obrigada pelo seu feedback!</h2>
          <p className="font-sans text-sm text-muted">Sua avaliação foi registrada. Ela nos ajuda a melhorar cada vez mais.</p>
        </div>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (Object.values(ratings).some((v) => v === 0)) {
      setError("Por favor, preencha todas as notas antes de enviar.");
      return;
    }
    if (recommend === null) {
      setError("Indique se recomendaria a apresentação para um colega.");
      return;
    }
    setError(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = await fetch("/api/presentation-evaluation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            presenterSlug:    "dra-vera",
            overallRating:    ratings.overall,
            contentRating:    ratings.content,
            didacticsRating:  ratings.didactics,
            applicability:    ratings.applicability,
            wouldRecommend:   recommend,
            highlight:        fd.get("highlight") as string || undefined,
            nextTopicSuggest: fd.get("nextTopicSuggest") as string || undefined,
            respondentName:   fd.get("respondentName") as string || undefined,
            respondentEmail:  fd.get("respondentEmail") as string || undefined,
          }),
        });
        if (!res.ok) throw new Error();
        setDone(true);
      } catch {
        setError("Ocorreu um erro. Tente novamente.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Notas */}
      <div className="rounded-2xl border border-border bg-white p-6 space-y-6">
        <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-muted">Avaliação</h3>
        <StarRating name="overallRating" label="Avaliação geral da apresentação" value={ratings.overall} onChange={setRating("overall")} />
        <div className="h-px bg-border" />
        <StarRating name="contentRating" label="Qualidade do conteúdo científico" value={ratings.content} onChange={setRating("content")} />
        <div className="h-px bg-border" />
        <StarRating name="didacticsRating" label="Didática e clareza na apresentação" value={ratings.didactics} onChange={setRating("didactics")} />
        <div className="h-px bg-border" />
        <StarRating name="applicability" label="Aplicabilidade clínica do conteúdo" value={ratings.applicability} onChange={setRating("applicability")} />
      </div>

      {/* Recomendação */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-4">Recomendação</h3>
        <p className="font-sans text-sm font-medium text-foreground mb-3">
          Você recomendaria este evento para um colega médico?
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={() => setRecommend(true)}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
              recommend === true ? "border-green-500 bg-green-500/10 text-green-700" : "border-border text-muted hover:border-green-500/40"
            }`}>
            Sim, com certeza!
          </button>
          <button type="button" onClick={() => setRecommend(false)}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
              recommend === false ? "border-red-400 bg-red-400/10 text-red-600" : "border-border text-muted hover:border-red-400/40"
            }`}>
            Não recomendaria
          </button>
        </div>
      </div>

      {/* Comentários */}
      <div className="rounded-2xl border border-border bg-white p-6 space-y-5">
        <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-muted">Comentários</h3>
        <div>
          <label className="font-sans text-sm font-medium text-foreground block mb-2">O que mais gostou na apresentação?</label>
          <textarea name="highlight" rows={3} placeholder="Compartilhe o que mais te impactou..."
            className="w-full px-4 py-3 text-sm text-foreground bg-background border border-border rounded-xl placeholder:text-muted/40 focus:outline-none focus:border-primary/50 resize-none transition-colors" />
        </div>
        <div>
          <label className="font-sans text-sm font-medium text-foreground block mb-2">Sugestão de tema para próximas apresentações</label>
          <textarea name="nextTopicSuggest" rows={2} placeholder="Que assunto você gostaria de ver na próxima palestra?"
            className="w-full px-4 py-3 text-sm text-foreground bg-background border border-border rounded-xl placeholder:text-muted/40 focus:outline-none focus:border-primary/50 resize-none transition-colors" />
        </div>
      </div>

      {/* Dados opcionais */}
      <div className="rounded-2xl border border-border bg-white p-6 space-y-4">
        <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-muted">Seus dados <span className="normal-case font-normal">(opcional)</span></h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-sans text-sm font-medium text-foreground block mb-1.5">Nome</label>
            <input name="respondentName" type="text" placeholder="Seu nome"
              className="w-full px-4 py-3 text-sm text-foreground bg-background border border-border rounded-xl placeholder:text-muted/40 focus:outline-none focus:border-primary/50 transition-colors" />
          </div>
          <div>
            <label className="font-sans text-sm font-medium text-foreground block mb-1.5">E-mail</label>
            <input name="respondentEmail" type="email" placeholder="seu@email.com"
              className="w-full px-4 py-3 text-sm text-foreground bg-background border border-border rounded-xl placeholder:text-muted/40 focus:outline-none focus:border-primary/50 transition-colors" />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
      )}

      <button type="submit" disabled={isPending}
        className="w-full flex items-center justify-center gap-2 font-sans text-sm font-semibold py-3.5 rounded-full bg-primary text-white hover:bg-primary/90 disabled:opacity-60 transition-all hover:shadow-[0_4px_20px_rgba(0,71,94,0.35)]">
        {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</> : "Enviar avaliação"}
      </button>
    </form>
  );
}
