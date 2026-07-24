/** Aviso de preço promocional (72h) da Super Live ROMA V — Curso DICI: 1º Lote. */

export const LIVE_DICI_SLUG = "dici-neurogastroenterologia-2026";
export const LIVE_DICI_PROMO_DEADLINE_UTC = "2026-07-25T22:30:00.000Z"; // 22/07 19h30 BRT + 72h
export const LIVE_DICI_COUPON_CODE = "LIVEROMAV15";
export const LIVE_DICI_DISCOUNT_PCT = 15;

export function isLiveDiciPromoActive(slug: string, now: number = Date.now()): boolean {
  return slug === LIVE_DICI_SLUG && now < Date.parse(LIVE_DICI_PROMO_DEADLINE_UTC);
}

/** Igual a isLiveDiciPromoActive, mas sem exigir o slug do curso — usado no
 * banner global do topo do site, visível em qualquer página durante a janela. */
export function isLivePromoWindowOpen(now: number = Date.now()): boolean {
  return now < Date.parse(LIVE_DICI_PROMO_DEADLINE_UTC);
}

export function liveDiciPromoDeadlineLabel(): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(LIVE_DICI_PROMO_DEADLINE_UTC));
}

export function liveDiciPromoPrice(fullPrice: number): number {
  return Math.round(fullPrice * (1 - LIVE_DICI_DISCOUNT_PCT / 100) * 100) / 100;
}
