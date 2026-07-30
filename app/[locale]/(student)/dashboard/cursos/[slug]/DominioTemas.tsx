import { Target, TrendingUp } from "lucide-react";
import type { DominioTema } from "@/lib/gamification";

/**
 * Desempenho do aluno por tema, calculado das respostas das provas.
 * Os temas vêm do mais fraco para o mais forte: o que interessa é onde estudar.
 */
export function DominioTemas({ temas }: { temas: DominioTema[] }) {
  if (temas.length === 0) return null;

  const totalRespondidas = temas.reduce((s, t) => s + t.total, 0);
  const totalAcertos = temas.reduce((s, t) => s + t.acertos, 0);
  const geral = totalRespondidas > 0 ? Math.round((totalAcertos / totalRespondidas) * 100) : 0;
  const maisFraco = temas[0];

  const cor = (pct: number) =>
    pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-red-400";
  const corTexto = (pct: number) =>
    pct >= 80 ? "text-green-700" : pct >= 60 ? "text-amber-700" : "text-red-600";

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">
            Seu domínio por tema
          </p>
          <p className="font-sans text-sm text-foreground">
            {totalAcertos} acertos em {totalRespondidas} questões respondidas
            <span className="mx-1.5 text-border">·</span>
            <span className={`font-semibold ${corTexto(geral)}`}>{geral}% no geral</span>
          </p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {temas.map((t) => (
          <div key={t.tema}>
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <span className="font-sans text-xs text-foreground truncate">{t.tema}</span>
              <span className="font-sans text-xs text-muted tabular-nums shrink-0">
                {t.acertos}/{t.total}
                <span className={`ml-1.5 font-semibold ${corTexto(t.pct)}`}>{t.pct}%</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-border/60 overflow-hidden">
              <div
                className={`h-full rounded-full ${cor(t.pct)} transition-all duration-700`}
                style={{ width: `${t.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {maisFraco.pct < 80 && (
        <div className="px-5 py-3 bg-background/60 border-t border-border flex items-start gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <p className="font-sans text-xs text-muted">
            Onde vale investir agora: <strong className="text-foreground">{maisFraco.tema}</strong>,
            seu tema com mais erros ({maisFraco.pct}% de acerto).
          </p>
        </div>
      )}
    </div>
  );
}
