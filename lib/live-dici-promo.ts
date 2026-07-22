/** Aviso de preço promocional (72h) da Super Live ROMA V — Curso DICI. */

export const LIVE_DICI_SLUG = "dici-neurogastroenterologia-2026";
const LIVE_DICI_PROMO_DEADLINE_UTC = "2026-07-25T22:30:00.000Z"; // 22/07 19h30 BRT + 72h

export function isLiveDiciPromoActive(slug: string, now: number = Date.now()): boolean {
  return slug === LIVE_DICI_SLUG && now < Date.parse(LIVE_DICI_PROMO_DEADLINE_UTC);
}

export function liveDiciPromoDeadlineLabel(): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(LIVE_DICI_PROMO_DEADLINE_UTC));
}
