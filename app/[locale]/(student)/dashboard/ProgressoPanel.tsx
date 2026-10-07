import { Flame, Trophy, Star, Lock } from "lucide-react";
import type { EstatisticasAluno } from "@/lib/gamification";
import { useLocale, useTranslations } from "next-intl";

/**
 * Bloco de progresso do aluno: pontos, ofensiva de dias e medalhas.
 * Só aparece quando já existe alguma atividade — antes disso seria uma tela
 * cheia de zeros, que desmotiva em vez de motivar.
 */
export function ProgressoPanel({ stats }: { stats: EstatisticasAluno }) {
  const { xp, detalhe, ofensiva, medalhas } = stats;
  const t = useTranslations("novaArea.componentes.progresso");
  const locale = useLocale();
  const num = (n: number) => n.toLocaleString(locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US");
  const detalheMedalha = (id: string) =>
    id === "constante" && ofensiva.recorde > 0
      ? t("medalhas.constante.detalhe", { count: ofensiva.recorde })
      : id === "curso-completo" && stats.provasAprovadas > 0
        ? t("medalhas.curso-completo.detalhe", { feitas: stats.provasAprovadas })
        : null;
  const conquistadas = medalhas.filter((m) => m.conquistada);

  return (
    <section className="px-4 lg:px-10 py-10 bg-background">
      <div className="flex items-baseline justify-between gap-4 mb-5 flex-wrap">
        <h2 className="font-serif text-2xl font-medium text-foreground">{t("titulo")}</h2>
        <span className="font-sans text-xs text-muted">
          {t("conquistasContagem", { feitas: conquistadas.length, total: medalhas.length })}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pontos */}
        <div className="bg-surface border border-border rounded-2xl px-5 py-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-primary" />
            <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted">
              {t("pontos")}
            </span>
          </div>
          <p className="font-sans text-4xl font-bold text-foreground tabular-nums leading-none">
            {num(xp)}
          </p>
          <div className="mt-4 space-y-1.5">
            {detalhe.map((d) => (
              <div key={d.chave} className="flex items-baseline justify-between gap-3">
                <span className="font-sans text-xs text-muted truncate">
                  {t(`itens.${d.chave}`)}
                  <span className="text-muted/60"> ×{d.quantidade}</span>
                </span>
                <span className="font-sans text-xs font-semibold text-foreground tabular-nums shrink-0">
                  +{num(d.pontos)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ofensiva */}
        <div className="bg-surface border border-border rounded-2xl px-5 py-5">
          <div className="flex items-center gap-2 mb-3">
            <Flame className={`w-4 h-4 ${ofensiva.atual > 0 ? "text-orange-500" : "text-muted"}`} />
            <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted">
              {t("ofensiva")}
            </span>
          </div>
          <p className="font-sans text-4xl font-bold text-foreground tabular-nums leading-none">
            {ofensiva.atual}
            <span className="font-sans text-base font-medium text-muted ml-1.5">
              {t("dias", { count: ofensiva.atual })}
            </span>
          </p>
          <p className="font-sans text-xs text-muted mt-3">
            {ofensiva.atual > 0
              ? t("manter")
              : ofensiva.diasAtivos > 0
                ? t("interrompida")
                : t("comecar")}
          </p>
          <div className="mt-3 pt-3 border-t border-border/60 flex items-baseline justify-between">
            <span className="font-sans text-xs text-muted">{t("melhorSequencia")}</span>
            <span className="font-sans text-xs font-semibold text-foreground tabular-nums">
              {t("diasValor", { count: ofensiva.recorde })}
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="font-sans text-xs text-muted">{t("diasEstudados")}</span>
            <span className="font-sans text-xs font-semibold text-foreground tabular-nums">
              {ofensiva.diasAtivos}
            </span>
          </div>
        </div>

        {/* Medalhas */}
        <div className="bg-surface border border-border rounded-2xl px-5 py-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted">
              {t("conquistas")}
            </span>
          </div>
          <div className="space-y-2">
            {medalhas.map((m) => (
              <div key={m.id} className="flex items-start gap-2.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    m.conquistada ? "bg-amber-500/15" : "bg-border/40"
                  }`}
                >
                  {m.conquistada ? (
                    <Trophy className="w-3 h-3 text-amber-600" />
                  ) : (
                    <Lock className="w-3 h-3 text-muted" />
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className={`font-sans text-xs font-semibold leading-tight ${
                      m.conquistada ? "text-foreground" : "text-muted"
                    }`}
                  >
                    {t(`medalhas.${m.id}.nome`)}
                  </p>
                  <p className="font-sans text-[11px] text-muted leading-snug">
                    {t(`medalhas.${m.id}.descricao`)}
                    {detalheMedalha(m.id) && !m.conquistada && (
                      <span className="text-muted/70"> · {detalheMedalha(m.id)}</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
