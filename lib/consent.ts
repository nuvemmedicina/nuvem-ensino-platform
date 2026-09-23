/**
 * Estado de consentimento de medição (Consent Mode v2), guardado no
 * navegador do visitante. Cobre só analytics_storage: este site ainda não
 * tem nenhum uso de anúncios ou remarketing, então ad_storage e afins ficam
 * sempre negados por padrão, ver app/[locale]/layout.tsx.
 */

export type ConsentChoice = "granted" | "denied";

const STORAGE_KEY = "nuvem_consent_analytics";
export const CONSENT_EVENT = "nuvem:consent-changed";

export function getStoredConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

function storeConsent(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // Armazenamento indisponível (aba anônima com bloqueio, etc): o
    // consentimento só vale para a sessão atual, sem persistir.
  }
}

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function pushConsentUpdate(choice: ConsentChoice) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "consent_update",
    analytics_storage: choice,
  });
}

/** Aplica a escolha do visitante: grava, avisa o GTM/GA4 e avisa o resto da
 * página (o PostHogProvider escuta esse evento para iniciar ou não a
 * captura, já que o Consent Mode do Google não cobre ferramentas fora do
 * Google). */
export function setConsent(choice: ConsentChoice) {
  storeConsent(choice);
  pushConsentUpdate(choice);
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
}
