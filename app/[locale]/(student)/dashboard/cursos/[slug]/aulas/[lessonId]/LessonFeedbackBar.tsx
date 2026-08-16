"use client";

import { useEffect, useState, useTransition } from "react";
import { ThumbsUp, ThumbsDown, Check, Loader2 } from "lucide-react";
import { salvarFeedbackAula } from "./feedbackActions";

type Props = {
  lessonId: string;
  inicial: { useful: boolean; suggestion: string | null } | null;
};

export function LessonFeedbackBar({ lessonId, inicial }: Props) {
  const [util, setUtil] = useState<boolean | null>(inicial?.useful ?? null);
  const [texto, setTexto] = useState(inicial?.suggestion ?? "");
  const [abrirTexto, setAbrirTexto] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Ao trocar de aula o componente é reaproveitado: volta ao estado da aula nova.
  useEffect(() => {
    setUtil(inicial?.useful ?? null);
    setTexto(inicial?.suggestion ?? "");
    setAbrirTexto(false);
    setSalvo(false);
  }, [lessonId, inicial?.useful, inicial?.suggestion]);

  function responder(valor: boolean) {
    setUtil(valor);
    setAbrirTexto(true);
    setSalvo(false);
    startTransition(async () => {
      await salvarFeedbackAula(lessonId, valor);
      setSalvo(true);
    });
  }

  function enviarTexto() {
    if (util === null) return;
    startTransition(async () => {
      await salvarFeedbackAula(lessonId, util, texto);
      setSalvo(true);
      setAbrirTexto(false);
    });
  }

  const botao = (valor: boolean, Icone: typeof ThumbsUp, rotulo: string) => {
    const ativo = util === valor;
    const cor = valor
      ? "border-green-500 bg-green-500/10 text-green-700"
      : "border-red-400 bg-red-400/10 text-red-600";
    return (
      <button
        type="button"
        onClick={() => responder(valor)}
        disabled={isPending}
        aria-pressed={ativo}
        aria-label={rotulo}
        className={`flex items-center gap-1.5 font-sans text-xs font-semibold px-3 py-1.5 rounded-full border transition-all disabled:opacity-60 ${
          ativo ? cor : "border-border text-muted hover:border-primary/40 hover:text-foreground"
        }`}
      >
        <Icone className="w-3.5 h-3.5" />
        {rotulo}
      </button>
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <p className="font-sans text-sm font-medium text-foreground">
          {util === null ? "Esta aula foi útil para você?" : "Obrigada pela resposta!"}
        </p>

        <div className="flex items-center gap-2">
          {botao(true, ThumbsUp, "Sim")}
          {botao(false, ThumbsDown, "Não")}
          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted" />}
          {salvo && !isPending && <Check className="w-4 h-4 text-green-600" />}
        </div>
      </div>

      {util !== null && (abrirTexto || texto) && (
        <div className="mt-3 pt-3 border-t border-border/60">
          <label className="font-sans text-xs text-muted block mb-2">
            {util
              ? "Quer contar o que funcionou bem? (opcional)"
              : "O que faltou nesta aula? (opcional)"}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); enviarTexto(); } }}
              placeholder="Escreva em uma linha"
              className="flex-1 px-3.5 py-2 font-sans text-sm text-foreground bg-background border border-border rounded-xl placeholder:text-muted/40 focus:outline-none focus:border-primary/50 transition-colors"
            />
            <button
              type="button"
              onClick={enviarTexto}
              disabled={isPending || !texto.trim()}
              className="font-sans text-xs font-semibold px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-40 transition-colors shrink-0"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
