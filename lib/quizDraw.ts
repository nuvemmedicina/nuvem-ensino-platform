/**
 * Sorteio de versões de prova.
 *
 * O sorteio é determinístico: a mesma combinação de aluno, prova e número da
 * tentativa produz sempre a mesma versão. Isso permite entregar a prova ao
 * aluno e, no envio, recompor exatamente a mesma versão para corrigir — sem
 * precisar gravar nada no banco enquanto a prova está em andamento (uma prova
 * abandonada, portanto, não queima tentativa).
 */

export type DrawInput = {
  id: string;
  text: string;
  order: number;
  explanation?: string | null;
  topic?: string | null;
  options: { id: string; text: string; order: number; isCorrect: boolean }[];
};

export type DrawnQuestion = {
  id: string;
  text: string;
  explanation: string | null;
  topic: string | null;
  options: { id: string; text: string; isCorrect: boolean }[];
};

export type DrawConfig = {
  userId: string;
  quizId: string;
  attemptIndex: number; // 0 na primeira tentativa
  perAttempt: number | null; // null = entrega todas as questões
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  avoidRepeats: boolean;
  seenQuestionIds: string[]; // questões já entregues em tentativas anteriores
};

/** Hash de string estável (FNV-1a 32 bits). */
function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** PRNG determinístico (mulberry32). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates com PRNG injetado — não altera o array recebido. */
function shuffle<T>(items: T[], rnd: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Monta a versão da prova para um aluno numa dada tentativa.
 *
 * Preferência por questões inéditas: com 30 questões cadastradas, 10 por prova
 * e 3 tentativas, as três tentativas cobrem o banco inteiro sem repetir nenhuma.
 * Se as inéditas não bastarem, completa com as já vistas (sem duplicar dentro
 * da mesma prova).
 */
export function drawQuizVersion(pool: DrawInput[], cfg: DrawConfig): DrawnQuestion[] {
  const rnd = mulberry32(hashSeed(`${cfg.userId}:${cfg.quizId}:${cfg.attemptIndex}`));

  const byOrder = pool.slice().sort((a, b) => a.order - b.order);
  const target =
    cfg.perAttempt && cfg.perAttempt > 0
      ? Math.min(cfg.perAttempt, byOrder.length)
      : byOrder.length;

  let picked: DrawInput[];

  if (target >= byOrder.length) {
    picked = byOrder;
  } else if (cfg.avoidRepeats && cfg.seenQuestionIds.length > 0) {
    const seen = new Set(cfg.seenQuestionIds);
    const fresh = shuffle(byOrder.filter((q) => !seen.has(q.id)), rnd);
    const reused = shuffle(byOrder.filter((q) => seen.has(q.id)), rnd);
    picked = [...fresh, ...reused].slice(0, target);
  } else {
    picked = shuffle(byOrder, rnd).slice(0, target);
  }

  const ordered = cfg.shuffleQuestions
    ? shuffle(picked, rnd)
    : picked.slice().sort((a, b) => a.order - b.order);

  return ordered.map((q) => {
    const opts = q.options.slice().sort((a, b) => a.order - b.order);
    const finalOpts = cfg.shuffleOptions ? shuffle(opts, rnd) : opts;
    return {
      id: q.id,
      text: q.text,
      explanation: q.explanation ?? null,
      topic: q.topic ?? null,
      options: finalOpts.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
    };
  });
}
