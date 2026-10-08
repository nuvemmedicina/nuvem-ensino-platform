"use client";

import { useState, useCallback, useEffect } from "react";
import { RotateCcw, ChevronLeft, ChevronRight, Trophy, Repeat } from "lucide-react";
import { useTranslations } from "next-intl";

type Card = { id: string; front: string; back: string };
type DesignConfig = {
  backgroundValue: string;
  textColor: string;
  borderRadius: number;
  flipAnimation: string;
  shuffleEnabled: boolean;
  spacedRepetitionEnabled: boolean;
} | null;
type Group = { id: string; title: string; cards: Card[]; designConfig: DesignConfig };
type Nota = "EASY" | "MEDIUM" | "HARD";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Cores fixas das notas: as mesmas em todos os módulos, para "verde = fácil"
// virar reflexo.
const NOTAS: { nota: Nota; chave: "dificil" | "medio" | "facil"; tecla: string; cor: string; fundo: string }[] = [
  { nota: "HARD", chave: "dificil", tecla: "1", cor: "#B4413A", fundo: "#FBEBEA" },
  { nota: "MEDIUM", chave: "medio", tecla: "2", cor: "#A86A10", fundo: "#FBF1E0" },
  { nota: "EASY", chave: "facil", tecla: "3", cor: "#2E7D55", fundo: "#E6F4EC" },
];

/**
 * Estudo de um grupo de flashcards, na cor do módulo (vem da página).
 * A frente é o cartão colorido com a pergunta; o verso, claro, com a
 * resposta. Espaço vira o card; 1, 2 e 3 dão a nota depois de virar.
 */
export function FlashcardPlayer({ group, cor, tint }: { group: Group; userId: string; cor: string; tint: string }) {
  const t = useTranslations("novaArea.paginas.flashcards");
  const design = group.designConfig;
  const shouldShuffle = design?.shuffleEnabled ?? true;
  const spacedRep = design?.spacedRepetitionEnabled ?? true;
  // Fundo escolhido no admin vale para a frente; o branco padrão dá lugar à cor do módulo
  const fundoProprio = design?.backgroundValue && !/^#?f{3,6}$/i.test(design.backgroundValue) ? design.backgroundValue : null;
  const fundoFrente = fundoProprio ?? `linear-gradient(140deg, ${cor} 0%, color-mix(in srgb, ${cor} 58%, black) 100%)`;
  const textoFrente = fundoProprio ? (design?.textColor ?? "#1a1a1a") : "#ffffff";

  const [deck, setDeck] = useState<Card[]>(() => (shouldShuffle ? shuffle(group.cards) : group.cards));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState<{ cardsReviewed: number; easy: number; medium: number; hard: number } | null>(null);

  useEffect(() => {
    fetch("/api/flashcards/study-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", groupId: group.id }),
    })
      .then((r) => r.json())
      .then((d) => setSessionId(d.sessionId));
  }, [group.id]);

  const current = deck[index];

  const rate = useCallback(
    async (rating: Nota) => {
      if (!sessionId || !current) return;

      await fetch("/api/flashcards/study-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "review", sessionId, flashcardId: current.id, rating }),
      });

      // Repetição espaçada: o card difícil volta três cards depois
      if (spacedRep && rating === "HARD") {
        const insertAt = Math.min(index + 3, deck.length);
        const newDeck = [...deck];
        newDeck.splice(insertAt, 0, { ...current, id: current.id + "_repeat" });
        setDeck(newDeck);
      }

      if (index + 1 >= deck.length) {
        const res = await fetch("/api/flashcards/study-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "finish", sessionId }),
        });
        const data = await res.json();
        setSummary(data.summary);
        setDone(true);
      } else {
        setIndex((i) => i + 1);
        setFlipped(false);
      }
    },
    [sessionId, current, index, deck, spacedRep],
  );

  // Atalhos: espaço vira; 1, 2 e 3 dão a nota (só com o card virado); setas navegam
  useEffect(() => {
    if (done) return;
    function onKey(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement | null;
      if (alvo && ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName)) return;
      if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && ["1", "2", "3"].includes(e.key)) {
        rate(NOTAS[Number(e.key) - 1].nota);
      } else if (e.key === "ArrowRight") {
        setIndex((i) => Math.min(i + 1, deck.length - 1));
        setFlipped(false);
      } else if (e.key === "ArrowLeft") {
        setIndex((i) => Math.max(i - 1, 0));
        setFlipped(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, flipped, rate, deck.length]);

  function recomecar() {
    setDeck(shouldShuffle ? shuffle(group.cards) : group.cards);
    setIndex(0);
    setFlipped(false);
    setDone(false);
    setSummary(null);
  }

  // ── Fim da sessão ──
  if (done && summary) {
    const total = Math.max(summary.cardsReviewed, 1);
    const pctFacil = Math.round((summary.easy / total) * 100);
    const frase = pctFacil >= 80 ? t("finalOtimo") : pctFacil >= 50 ? t("finalBom") : t("finalRevisar");
    return (
      <div className="rounded-3xl border border-border bg-surface overflow-hidden">
        <div className="px-6 py-8 text-center flex flex-col items-center gap-3" style={{ background: tint }}>
          <span className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg" style={{ background: cor }}>
            <Trophy className="w-8 h-8" aria-hidden="true" />
          </span>
          <h2 className="font-serif text-3xl font-medium text-foreground">{t("sessaoConcluida")}</h2>
          <p className="font-sans text-sm text-muted">
            {t("revisados", { n: summary.cardsReviewed })} · {frase}
          </p>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Barra empilhada com a proporção das notas */}
          <div className="flex h-3 rounded-full overflow-hidden bg-border" aria-hidden="true">
            {NOTAS.map(({ nota, cor: c }) => {
              const n = nota === "EASY" ? summary.easy : nota === "MEDIUM" ? summary.medium : summary.hard;
              return n > 0 ? <div key={nota} style={{ width: `${(n / total) * 100}%`, background: c }} /> : null;
            })}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[...NOTAS].reverse().map(({ nota, chave, cor: c, fundo }) => {
              const n = nota === "EASY" ? summary.easy : nota === "MEDIUM" ? summary.medium : summary.hard;
              return (
                <div key={nota} className="rounded-2xl p-4 text-center" style={{ background: fundo }}>
                  <p className="font-sans text-3xl font-bold tabular-nums" style={{ color: c }}>{n}</p>
                  <p className="font-sans text-xs font-semibold mt-1" style={{ color: c }}>{t(chave)}</p>
                </div>
              );
            })}
          </div>
          <button
            onClick={recomecar}
            className="self-center inline-flex items-center gap-2 font-sans text-sm font-semibold min-h-[48px] px-6 rounded-full text-white hover:opacity-90 transition-opacity"
            style={{ background: cor }}
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" /> {t("estudarNovamente")}
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const isRepeat = current.id.includes("_repeat");
  const progresso = Math.round((index / deck.length) * 100);

  return (
    <div className="flex flex-col gap-5">
      {/* Progresso */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: tint }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(progresso, 2)}%`, background: cor }} />
        </div>
        <span className="font-sans text-xs font-semibold tabular-nums px-2.5 py-1 rounded-full" style={{ background: tint, color: cor }}>
          {Math.min(index + 1, deck.length)} / {deck.length}
        </span>
      </div>

      {/* Card */}
      <div
        role="button"
        tabIndex={0}
        aria-label={flipped ? t("verFrente") : t("virar")}
        className="relative cursor-pointer select-none outline-none focus-visible:ring-4 rounded-3xl"
        style={{ perspective: "1400px" }}
        onClick={() => setFlipped((f) => !f)}
        onKeyDown={(e) => {
          if (e.key === "Enter") setFlipped((f) => !f);
        }}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)", minHeight: 320 }}
        >
          {/* Frente: pergunta, na cor do módulo */}
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden flex flex-col items-center justify-center px-8 py-10 text-center shadow-xl"
            style={{ backfaceVisibility: "hidden", background: fundoFrente, color: textoFrente }}
          >
            {!fundoProprio && (
              <>
                <div aria-hidden="true" className="absolute -left-12 -top-12 w-48 h-48 rounded-full bg-white/10" />
                <div aria-hidden="true" className="absolute -right-8 -bottom-16 w-56 h-56 rounded-full bg-white/[0.07]" />
              </>
            )}
            {isRepeat && (
              <span className="absolute top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 font-sans text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/90 text-[#B4413A]">
                <Repeat className="w-3 h-3" aria-hidden="true" /> {t("revisandoDificil")}
              </span>
            )}
            <span className="relative font-sans text-[11px] font-bold uppercase tracking-[0.18em] opacity-70 mb-4">{t("pergunta")}</span>
            <p className="relative font-serif text-2xl sm:text-[28px] font-medium leading-snug text-balance">{current.front.replace("_repeat", "")}</p>
            <p className="relative font-sans text-xs opacity-60 mt-8">{t("toqueVirar")}</p>
          </div>

          {/* Verso: resposta, claro com a cor do módulo nos detalhes */}
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden flex flex-col items-center justify-center px-8 py-10 text-center shadow-xl bg-surface border-2"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", borderColor: cor }}
          >
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-2" style={{ background: cor }} />
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] mb-4" style={{ color: cor }}>{t("resposta")}</span>
            <p className="font-sans text-base sm:text-lg leading-relaxed text-foreground text-pretty">{current.back}</p>
          </div>
        </div>
      </div>

      {/* Notas: aparecem depois de virar */}
      <div className={`flex flex-col gap-2 transition-opacity duration-300 ${flipped ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <p className="font-sans text-xs font-semibold text-muted text-center">{t("comoFoi")}</p>
        <div className="grid grid-cols-3 gap-3">
          {NOTAS.map(({ nota, chave, tecla, cor: c, fundo }) => (
            <button
              key={nota}
              onClick={() => rate(nota)}
              tabIndex={flipped ? 0 : -1}
              className="min-h-[52px] rounded-2xl font-sans text-sm font-bold border-2 transition-transform hover:-translate-y-0.5 active:translate-y-0"
              style={{ borderColor: c, color: c, background: fundo }}
            >
              {t(chave)}
              <span className="hidden sm:inline ml-1.5 font-normal opacity-60">({tecla})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navegação */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { if (index > 0) { setIndex((i) => i - 1); setFlipped(false); } }}
          disabled={index === 0}
          aria-label={t("anterior")}
          className="w-11 h-11 rounded-full flex items-center justify-center border border-border text-muted hover:text-foreground disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setFlipped((f) => !f)}
          className="font-sans text-sm font-semibold min-h-[44px] px-6 rounded-full text-white hover:opacity-90"
          style={{ background: cor }}
        >
          {flipped ? t("verFrente") : t("virar")}
        </button>
        <button
          onClick={() => { setIndex((i) => Math.min(i + 1, deck.length - 1)); setFlipped(false); }}
          disabled={index >= deck.length - 1}
          aria-label={t("proximo")}
          className="w-11 h-11 rounded-full flex items-center justify-center border border-border text-muted hover:text-foreground disabled:opacity-30"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <p className="hidden sm:block font-sans text-[11px] text-muted text-center">{t("atalhos")}</p>
    </div>
  );
}
