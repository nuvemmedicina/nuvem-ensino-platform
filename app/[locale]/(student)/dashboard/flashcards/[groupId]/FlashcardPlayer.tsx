"use client";

import { useState, useCallback, useEffect } from "react";
import { RotateCcw, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function FlashcardPlayer({ group, userId }: { group: Group; userId: string }) {
  const design = group.designConfig;
  const bg = design?.backgroundValue ?? "#ffffff";
  const textColor = design?.textColor ?? "#1a1a1a";
  const radius = design?.borderRadius ?? 16;
  const shouldShuffle = design?.shuffleEnabled ?? true;
  const spacedRep = design?.spacedRepetitionEnabled ?? true;

  const [deck, setDeck] = useState<Card[]>(() =>
    shouldShuffle ? shuffle(group.cards) : group.cards,
  );
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, "EASY" | "MEDIUM" | "HARD">>({});
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState<{ cardsReviewed: number; easy: number; medium: number; hard: number } | null>(null);

  // Start session on mount
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
    async (rating: "EASY" | "MEDIUM" | "HARD") => {
      if (!sessionId || !current) return;
      setRatings((prev) => ({ ...prev, [current.id]: rating }));

      await fetch("/api/flashcards/study-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "review", sessionId, flashcardId: current.id, rating }),
      });

      // Spaced repetition: HARD cards get re-added later in deck
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

  if (done && summary) {
    return (
      <div className="text-center max-w-sm w-full">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="font-serif text-2xl font-medium text-foreground mb-2">Sessão concluída!</h2>
        <p className="font-sans text-sm text-muted mb-6">{summary.cardsReviewed} cards revisados</p>
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
            <p className="font-sans text-2xl font-bold text-green-600">{summary.easy}</p>
            <p className="font-sans text-xs text-green-700 mt-1">Fácil</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
            <p className="font-sans text-2xl font-bold text-amber-600">{summary.medium}</p>
            <p className="font-sans text-xs text-amber-700 mt-1">Médio</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <p className="font-sans text-2xl font-bold text-red-600">{summary.hard}</p>
            <p className="font-sans text-xs text-red-700 mt-1">Difícil</p>
          </div>
        </div>
        <button
          onClick={() => { setDeck(shouldShuffle ? shuffle(group.cards) : group.cards); setIndex(0); setFlipped(false); setRatings({}); setDone(false); setSummary(null); }}
          className="inline-flex items-center gap-2 font-sans text-sm font-semibold px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Estudar novamente
        </button>
      </div>
    );
  }

  if (!current) return null;

  const isRepeat = current.id.includes("_repeat");

  return (
    <div className="w-full max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-sans text-sm font-semibold text-foreground truncate">{group.title}</h2>
        <span className="font-sans text-xs text-muted">{Math.min(index + 1, deck.length)} / {deck.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-border rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${((index) / deck.length) * 100}%` }}
        />
      </div>

      {isRepeat && (
        <div className="text-center mb-2">
          <span className="font-sans text-[10px] font-bold text-red-600 bg-red-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Revisando — Difícil</span>
        </div>
      )}

      {/* Flashcard */}
      <div
        className="relative cursor-pointer select-none"
        style={{ perspective: "1200px" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="relative w-full transition-transform duration-500 shadow-xl"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            borderRadius: radius,
            minHeight: 260,
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: "hidden", background: bg, borderRadius: radius, color: textColor }}
          >
            <span className="font-sans text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3">Frente</span>
            <p className="font-sans text-lg font-medium leading-relaxed">{current.front.replace("_repeat", "")}</p>
            <p className="font-sans text-xs opacity-40 mt-6">Toque para virar</p>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: bg, borderRadius: radius, color: textColor, filter: "brightness(0.96)" }}
          >
            <span className="font-sans text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3">Verso</span>
            <p className="font-sans text-base leading-relaxed">{current.back}</p>
          </div>
        </div>
      </div>

      {/* Rating buttons */}
      <div className={`mt-6 flex gap-3 transition-opacity duration-300 ${flipped ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <button onClick={() => rate("HARD")} className="flex-1 py-3 rounded-xl font-sans text-sm font-bold border-2 border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
          😰 Difícil
        </button>
        <button onClick={() => rate("MEDIUM")} className="flex-1 py-3 rounded-xl font-sans text-sm font-bold border-2 border-amber-400 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors">
          🤔 Médio
        </button>
        <button onClick={() => rate("EASY")} className="flex-1 py-3 rounded-xl font-sans text-sm font-bold border-2 border-green-400 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors">
          😊 Fácil
        </button>
      </div>

      {/* Nav */}
      <div className="flex justify-between mt-4">
        <button onClick={() => { if (index > 0) { setIndex((i) => i - 1); setFlipped(false); } }} disabled={index === 0} className="p-2 rounded-lg text-muted hover:text-foreground disabled:opacity-20">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={() => setFlipped((f) => !f)} className="font-sans text-xs text-muted hover:text-foreground">
          {flipped ? "Ver frente" : "Virar"}
        </button>
        <button onClick={() => { setIndex((i) => Math.min(i + 1, deck.length - 1)); setFlipped(false); }} disabled={index >= deck.length - 1} className="p-2 rounded-lg text-muted hover:text-foreground disabled:opacity-20">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
