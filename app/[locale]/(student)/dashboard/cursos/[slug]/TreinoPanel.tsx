"use client";

import { useState, useTransition } from "react";
import { Dumbbell, CheckCircle, XCircle, Lightbulb, ChevronRight, RotateCcw } from "lucide-react";
import { iniciarTreino, responderTreino, type QuestaoTreino } from "./practiceActions";

type Feedback = {
  acertou: boolean;
  opcaoCorretaId: string;
  textoCorreto: string;
  justificativa: string | null;
};

const LETRAS = ["A", "B", "C", "D", "E"];

export function TreinoPanel({ quizId, moduleTitle }: { quizId: string; moduleTitle: string }) {
  const [fase, setFase] = useState<"convite" | "treino" | "fim">("convite");
  const [questoes, setQuestoes] = useState<QuestaoTreino[]>([]);
  const [indice, setIndice] = useState(0);
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [erro, setErro] = useState("");
  const [pendente, startTransition] = useTransition();

  const questao = questoes[indice];
  const ultima = indice === questoes.length - 1;

  function comecar() {
    setErro("");
    startTransition(async () => {
      const r = await iniciarTreino(quizId);
      if (!r.ok) {
        setErro(r.error);
        return;
      }
      setQuestoes(r.questoes);
      setIndice(0);
      setEscolhida(null);
      setFeedback(null);
      setAcertos(0);
      setFase("treino");
    });
  }

  function responder(optionId: string) {
    if (feedback) return; // já respondida
    setEscolhida(optionId);
    setErro("");
    startTransition(async () => {
      const r = await responderTreino(quizId, questao.id, optionId);
      if (!r.ok) {
        setErro(r.error);
        setEscolhida(null);
        return;
      }
      setFeedback(r);
      if (r.acertou) setAcertos((n) => n + 1);
    });
  }

  function proxima() {
    if (ultima) {
      setFase("fim");
      return;
    }
    setIndice((i) => i + 1);
    setEscolhida(null);
    setFeedback(null);
  }

  // ── Convite ───────────────────────────────────────────────────────────────
  if (fase === "convite") {
    return (
      <div className="rounded-2xl border border-border bg-surface px-5 py-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-accent/40 flex items-center justify-center shrink-0">
          <Dumbbell className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">
            Treino — {moduleTitle}
          </p>
          <p className="font-sans text-sm text-foreground">Pratique sem valer nota</p>
          <p className="font-sans text-xs text-muted mt-0.5">
            Questões do módulo com a explicação logo após cada resposta. Não conta tentativa nem nota.
          </p>
          {erro && <p className="font-sans text-xs text-red-500 mt-1.5">{erro}</p>}
        </div>
        <button
          onClick={comecar}
          disabled={pendente}
          className="shrink-0 flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2.5 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
        >
          {pendente ? "Preparando…" : "Treinar"}
          {!pendente && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    );
  }

  // ── Treino ────────────────────────────────────────────────────────────────
  if (fase === "treino" && questao) {
    return (
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="h-1 bg-border">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(indice / questoes.length) * 100}%` }}
          />
        </div>

        <div className="px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <span className="font-sans text-xs font-bold text-muted uppercase tracking-wider">
              Treino · {indice + 1} de {questoes.length}
            </span>
            <span className="font-sans text-[11px] text-muted">
              {acertos} acerto{acertos !== 1 ? "s" : ""} até aqui
            </span>
          </div>

          {questao.topic && (
            <span className="inline-block mb-3 font-sans text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
              {questao.topic}
            </span>
          )}

          <p className="font-serif text-xl sm:text-2xl font-medium text-foreground leading-snug mb-6">
            {questao.text}
          </p>

          <div className="space-y-2.5">
            {questao.options.map((opt, i) => {
              const escolha = escolhida === opt.id;
              const eCorreta = feedback?.opcaoCorretaId === opt.id;
              const erradaEscolhida = feedback && escolha && !feedback.acertou;

              let estilo = "border-border hover:border-primary/40 hover:bg-primary/5 text-foreground";
              if (feedback) {
                if (eCorreta) estilo = "border-green-500 bg-green-500/10 text-green-800 font-semibold";
                else if (erradaEscolhida) estilo = "border-red-400 bg-red-500/10 text-red-700";
                else estilo = "border-border text-muted opacity-60";
              } else if (escolha) {
                estilo = "border-primary bg-primary/10 text-primary font-semibold";
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={!!feedback || pendente}
                  onClick={() => responder(opt.id)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border font-sans text-sm transition-all duration-200 disabled:cursor-default ${estilo}`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      feedback && eCorreta
                        ? "bg-green-500 text-white"
                        : erradaEscolhida
                          ? "bg-red-400 text-white"
                          : escolha
                            ? "bg-primary text-white"
                            : "bg-border/60 text-muted"
                    }`}
                  >
                    {LETRAS[i]}
                  </span>
                  <span className="leading-snug flex-1">{opt.text}</span>
                  {feedback && eCorreta && <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />}
                  {erradaEscolhida && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                </button>
              );
            })}
          </div>

          {erro && <p className="mt-3 font-sans text-xs text-red-500">{erro}</p>}

          {feedback && (
            <div className="mt-4 rounded-xl border border-border bg-background/60 px-4 py-3">
              <p
                className={`font-sans text-xs font-bold uppercase tracking-wider mb-2 ${
                  feedback.acertou ? "text-green-700" : "text-red-600"
                }`}
              >
                {feedback.acertou ? "Você acertou" : "Resposta correta: " + feedback.textoCorreto}
              </p>
              {feedback.justificativa && (
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <p className="font-sans text-xs text-muted leading-relaxed">{feedback.justificativa}</p>
                </div>
              )}
              <button
                onClick={proxima}
                className="mt-3 flex items-center gap-1.5 font-sans text-sm font-semibold px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                {ultima ? "Terminar treino" : "Próxima"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Fim ───────────────────────────────────────────────────────────────────
  const pct = questoes.length > 0 ? Math.round((acertos / questoes.length) * 100) : 0;
  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-6 flex flex-col items-center text-center gap-3">
      <div className="w-14 h-14 rounded-full bg-accent/40 flex items-center justify-center">
        <Dumbbell className="w-7 h-7 text-primary" />
      </div>
      <div>
        <p className="font-sans text-sm font-bold uppercase tracking-widest text-primary mb-1">
          Treino concluído
        </p>
        <p className="font-sans text-3xl font-bold text-foreground">
          {acertos} de {questoes.length}
        </p>
        <p className="font-sans text-xs text-muted mt-1">
          {pct}% de acerto · não conta como tentativa da prova
        </p>
      </div>
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <button
          onClick={comecar}
          disabled={pendente}
          className="flex items-center gap-2 font-sans text-sm font-semibold px-5 py-2.5 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          {pendente ? "Preparando…" : "Treinar de novo"}
        </button>
        <button
          onClick={() => setFase("convite")}
          className="font-sans text-xs text-muted hover:text-foreground transition-colors"
        >
          Fechar
        </button>
      </div>
      <p className="font-sans text-[11px] text-muted max-w-sm">
        No próximo treino, as questões que você ainda não acertou vêm primeiro.
      </p>
    </div>
  );
}
