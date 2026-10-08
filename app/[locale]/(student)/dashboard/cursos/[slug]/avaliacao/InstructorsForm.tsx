"use client";

import { useState, useTransition } from "react";
import { Star, CheckCircle, Loader2, GraduationCap } from "lucide-react";
import { useTranslations } from "next-intl";

export type DocenteParaAvaliar = {
  id: string;
  nome: string;
  titulo: string | null;
  fotoUrl: string | null;
  aulas: number;
  /** O aluno concluiu ao menos uma aula desse docente. */
  assistiu: boolean;
  notaAnterior: number | null;
  sugestaoAnterior: string | null;
};

type Props = {
  action: (formData: FormData) => Promise<void>;
  docentes: DocenteParaAvaliar[];
};

function Estrelas({ name, valorInicial }: { name: string; valorInicial: number | null }) {
  const t = useTranslations("novaArea.paginas.avaliacao");
  const [hover, setHover] = useState(0);
  const [sel, setSel] = useState(valorInicial ?? 0);
  const ativo = hover || sel;

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setSel(n === sel ? 0 : n)}
            className="transition-transform hover:scale-110 focus:outline-none"
            aria-label={t("estrelas", { n })}
          >
            <Star
              className="w-6 h-6 transition-colors"
              fill={ativo >= n ? "#f59e0b" : "none"}
              stroke={ativo >= n ? "#f59e0b" : "currentColor"}
              strokeWidth={1.5}
              style={{ color: ativo >= n ? "#f59e0b" : "var(--color-border)" }}
            />
          </button>
        ))}
      </div>
      {sel > 0 && (
        <button
          type="button"
          onClick={() => setSel(0)}
          className="font-sans text-[11px] text-muted hover:text-foreground transition-colors"
        >
          {t("limpar")}
        </button>
      )}
      <input type="hidden" name={name} value={sel} />
    </div>
  );
}

export function InstructorsForm({ action, docentes }: Props) {
  const t = useTranslations("novaArea.paginas.avaliacao");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const jaAvaliou = docentes.some((d) => d.notaAnterior !== null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const algumaNota = [...formData.entries()].some(
      ([k, v]) => k.startsWith("rating:") && Number(v) > 0,
    );
    if (!algumaNota) {
      setErro(t("umaNota"));
      return;
    }
    setErro(null);

    startTransition(async () => {
      try {
        await action(formData);
        setDone(true);
      } catch {
        setErro(t("erro"));
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 flex flex-col items-center gap-3 text-center">
        <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle className="w-7 h-7 text-green-500" />
        </div>
        <div>
          <p className="font-serif text-lg font-medium text-foreground">{t("obrigadaCurta")}</p>
          <p className="font-sans text-sm text-muted">
            {t("docentesRegistrada")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {jaAvaliou && (
        <div className="flex items-start gap-3 bg-primary/8 border border-primary/20 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="font-sans text-sm text-primary/90">
            {t("jaAvaliouDocentes")}
          </p>
        </div>
      )}

      {docentes.map((d) => (
        <div key={d.id} className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary/10 border border-border shrink-0 flex items-center justify-center">
              {d.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.fotoUrl} alt={d.nome} className="w-full h-full object-cover object-top" />
              ) : (
                <GraduationCap className="w-5 h-5 text-primary/60" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm font-semibold text-foreground">{d.nome}</p>
              {d.titulo && <p className="font-sans text-xs text-muted">{d.titulo}</p>}
              <p className="font-sans text-[11px] text-muted mt-0.5">
                {t("aulasNoCurso", { n: d.aulas })}
                {d.assistiu && (
                  <>
                    <span className="mx-1.5 text-border">·</span>
                    <span className="text-primary font-semibold">{t("voceAssistiu")}</span>
                  </>
                )}
              </p>

              <div className="mt-3">
                <Estrelas name={`rating:${d.id}`} valorInicial={d.notaAnterior} />
              </div>

              <textarea
                name={`suggestion:${d.id}`}
                defaultValue={d.sugestaoAnterior ?? ""}
                rows={2}
                placeholder={t("melhorarPlaceholder", { nome: d.nome.split(" ").slice(0, 2).join(" ") })}
                className="mt-3 w-full px-3.5 py-2.5 font-sans text-sm text-foreground bg-background border border-border rounded-xl placeholder:text-muted/40 focus:outline-none focus:border-primary/50 resize-none transition-colors"
              />
            </div>
          </div>
        </div>
      ))}

      {erro && (
        <p className="font-sans text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 font-sans text-sm font-semibold py-3.5 rounded-full bg-primary text-white hover:bg-primary-dark disabled:opacity-60 transition-all hover:shadow-[0_4px_20px_rgba(0,71,94,0.35)]"
      >
        {isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> {t("enviando")}</>
        ) : jaAvaliou ? (
          t("atualizarDocentes")
        ) : (
          t("enviarDocentes")
        )}
      </button>
    </form>
  );
}
