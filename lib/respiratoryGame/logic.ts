import { RespiratoryCase } from "./cases";
import { GameLang } from "./i18n";

export type AnswerMode = "statement" | "diagnosis" | "validity";
export type ConfidenceLevel = "baixa" | "média" | "alta";
export type LevelSetting = "progressive" | 1 | 2 | 3 | 4;

/** Chave estável (independente de idioma) do conceito treinado por um caso. */
export function conceptKey(c: RespiratoryCase): string {
  if (c.category === "SIBO") return c.short.includes("120") ? "sibo_time_window" : "sibo_h2_threshold";
  if (c.category === "IMO") return "imo_ch4";
  if (c.category === "Qualidade") return "quality";
  if (c.category === "Lactose" || c.category === "Frutose") return "intolerance_vs_malabsorption";
  return "sacarose_interpretation";
}

const conceptLabels: Record<string, { pt: string; es: string }> = {
  sibo_time_window: { pt: "SIBO · janela temporal", es: "SIBO · ventana temporal" },
  sibo_h2_threshold: { pt: "SIBO · limiar H₂", es: "SIBO · umbral de H₂" },
  imo_ch4: { pt: "IMO · CH₄", es: "IMO · CH₄" },
  quality: { pt: "Qualidade técnica", es: "Calidad técnica" },
  intolerance_vs_malabsorption: { pt: "Intolerância × má absorção", es: "Intolerancia × malabsorción" },
  sacarose_interpretation: { pt: "Sacarose · interpretação", es: "Sacarosa · interpretación" },
};

export function conceptLabel(key: string, lang: GameLang): string {
  return conceptLabels[key]?.[lang] ?? key;
}

export const categoryLabels: Record<RespiratoryCase["category"], { pt: string; es: string }> = {
  SIBO: { pt: "SIBO", es: "SIBO" },
  IMO: { pt: "IMO", es: "IMO" },
  Lactose: { pt: "Lactose", es: "Lactosa" },
  Frutose: { pt: "Frutose", es: "Fructosa" },
  Sacarose: { pt: "Sacarose", es: "Sacarosa" },
  Qualidade: { pt: "Qualidade", es: "Calidad" },
};

export function categoryLabel(category: RespiratoryCase["category"], lang: GameLang): string {
  return categoryLabels[category][lang];
}

/** Conjunto de estatísticas n/ok por chave — mesmo formato do store.concepts do app original. */
export type StatMap = Record<string, { n: number; ok: number }>;

export function priorityOf(c: RespiratoryCase, conceptStats: StatMap): number {
  const x = conceptStats[conceptKey(c)] || { n: 0, ok: 0 };
  return x.n ? (x.n - x.ok) / x.n : 0;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function buildSession(cases: RespiratoryCase[], level: LevelSetting, conceptStats: StatMap): RespiratoryCase[] {
  let pool = level === "progressive" ? cases : cases.filter((c) => c.difficulty === level);
  pool = shuffle(pool).sort((a, b) => priorityOf(b, conceptStats) - priorityOf(a, conceptStats));
  if (level === "progressive") {
    const out: RespiratoryCase[] = [];
    ([1, 2, 3, 4] as const).forEach((d) => out.push(...pool.filter((c) => c.difficulty === d).slice(0, 3)));
    return out;
  }
  return pool;
}

export function diagnosisFor(c: RespiratoryCase, lang: GameLang): string {
  const pt = lang === "pt";
  if (c.category === "SIBO") return c.answer ? "SIBO positivo" : pt ? "Negativo / sem critério SIBO" : "Negativo / sin criterio SIBO";
  if (c.category === "IMO") return c.answer ? "IMO positivo" : pt ? "Negativo / sem critério IMO" : "Negativo / sin criterio IMO";
  if (c.category === "Qualidade") return pt ? "Problema técnico / inconclusivo" : "Problema técnico / no concluyente";
  if (c.category === "Lactose") {
    if (c.answer) return pt ? "Intolerância à lactose" : "Intolerancia a la lactosa";
    return pt ? "Má absorção / negativo / inconclusivo" : "Malabsorción / negativo / no concluyente";
  }
  if (c.category === "Frutose") {
    if (c.answer) return pt ? "Intolerância à frutose" : "Intolerancia a la fructosa";
    return pt ? "Má absorção / negativo" : "Malabsorción / negativo";
  }
  const label = categoryLabel(c.category, lang);
  return c.answer ? `${label} positivo` : pt ? "Negativo / inconclusivo" : "Negativo / no concluyente";
}

export function diagnosisOptions(c: RespiratoryCase, lang: GameLang): string[] {
  const pt = lang === "pt";
  const pool = [
    diagnosisFor(c, lang),
    "SIBO positivo",
    "IMO positivo",
    pt ? "Negativo / sem critério" : "Negativo / sin criterio",
    pt ? "Problema técnico / inconclusivo" : "Problema técnico / no concluyente",
    pt ? "Má absorção / negativo / inconclusivo" : "Malabsorción / negativo / no concluyente",
  ];
  const unique = [...new Set(pool)].slice(0, 4);
  return shuffle(unique);
}

/** Pontos do gráfico SVG (620×270, mesmas proporções do app original). */
export function chartGeometry(c: RespiratoryCase) {
  const W = 620;
  const H = 270;
  const p = 40;
  const max = Math.max(50, ...c.h2, ...c.ch4, c.marker?.value || 0) + 10;
  const maxT = Math.max(...c.t);
  const x = (v: number) => p + (v / maxT) * (W - 2 * p);
  const y = (v: number) => H - p - (v / max) * (H - 2 * p);
  const gridLines = Array.from({ length: 6 }, (_, k) => {
    const v = Math.round((max * k) / 5);
    return { v, y: y(v) };
  });
  const h2Points = c.t.map((t, j) => `${x(t)},${y(c.h2[j])}`).join(" ");
  const ch4Points = c.t.map((t, j) => `${x(t)},${y(c.ch4[j])}`).join(" ");
  const timeLabels = c.t.map((t) => ({ t, x: x(t) }));

  let markerLine: { x1: number; y1: number; x2: number; y2: number } | null = null;
  let markerLine2: { x1: number; y1: number; x2: number; y2: number } | null = null;
  const m = c.marker;
  if (m) {
    if (m.value != null) markerLine = { x1: p, y1: y(m.value), x2: W - p, y2: y(m.value) };
    if (m.time != null) markerLine2 = { x1: x(m.time), y1: p, x2: x(m.time), y2: H - p };
  }

  return { W, H, p, gridLines, h2Points, ch4Points, timeLabels, markerLine, markerLine2 };
}
