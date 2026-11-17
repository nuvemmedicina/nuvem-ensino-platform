/** Número máximo de parcelas no cartão (Asaas). Vale para o checkout e para a API. */
export const MAX_PARCELAS = 5;

/** Cursos com limite de parcelas menor que o padrão. */
const MAX_PARCELAS_POR_CURSO: Record<string, number> = {
  // Teste respiratório de 12/12/2026, presencial e online: só até 2x (decisão da Ana, 16–17/11/2026).
  "testes-respiratorios-h2-ch4-h2s-teorico-pratico": 2,
  "testes-respiratorios-h2-ch4-h2s-online": 2,
};

/** Máximo de parcelas para o curso; use no checkout, na API e nas páginas que citam o parcelamento. */
export function maxParcelas(slug: string): number {
  return MAX_PARCELAS_POR_CURSO[slug] ?? MAX_PARCELAS;
}
