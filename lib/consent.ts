/**
 * Estado de consentimento de medição (Consent Mode v2), guardado no
 * navegador do visitante. Duas categorias, cada uma com sua própria escolha:
 * "analytics" (GA4/PostHog, cobre analytics_storage) e "marketing" (Meta
 * Pixel, cobre ad_storage/ad_user_data/ad_personalization). São categorias
 * diferentes de propósito (medição de uso versus publicidade/remarketing),
 * então cada uma tem seu próprio interruptor no banner, não uma coisa só.
 */

export type ConsentChoice = "granted" | "denied";
export type ConsentCategory = "analytics" | "marketing";

const STORAGE_KEYS: Record<ConsentCategory, string> = {
  analytics: "nuvem_consent_analytics",
  marketing: "nuvem_consent_marketing",
};
export const CONSENT_EVENT = "nuvem:consent-changed";

export function getStoredConsent(category: ConsentCategory): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEYS[category]);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

function storeConsent(category: ConsentCategory, choice: ConsentChoice) {
  try {
    window.localStorage.setItem(STORAGE_KEYS[category], choice);
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

/** Manda o estado das duas categorias de uma vez: precisa ser o comando
 * gtag('consent', 'update', {...}), não um evento comum, é o único formato
 * que o Consent Mode do Google reconhece. gtag() empilha os argumentos como
 * array, então reproduzimos o mesmo formato aqui. A tag do Meta Pixel não
 * usa esse mecanismo do Google, ela é configurada no próprio GTM para exigir
 * ad_storage concedido antes de disparar (ver docs/medicao), então bastam
 * esses quatro sinais para governar as duas ferramentas. */
function pushConsentUpdate(analytics: ConsentChoice, marketing: ConsentChoice) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push([
    "consent",
    "update",
    {
      analytics_storage: analytics,
      ad_storage: marketing,
      ad_user_data: marketing,
      ad_personalization: marketing,
    },
  ]);
}

/** Aplica a escolha de uma categoria, mantendo a outra como está (lida do
 * armazenamento; se ainda não houver escolha para ela, trata como negada,
 * igual ao padrão do Consent Mode). Grava, avisa o GTM/GA4 e avisa o resto
 * da página (o PostHogProvider escuta esse evento para iniciar ou não a
 * captura, já que o Consent Mode do Google não cobre ferramentas fora do
 * Google). */
export function setConsent(category: ConsentCategory, choice: ConsentChoice) {
  storeConsent(category, choice);
  const other: ConsentCategory = category === "analytics" ? "marketing" : "analytics";
  const otherChoice = getStoredConsent(other) ?? "denied";
  pushConsentUpdate(
    category === "analytics" ? choice : otherChoice,
    category === "marketing" ? choice : otherChoice,
  );
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: { category, choice } }));
}

/** Aplica a mesma escolha às duas categorias de uma vez ("Aceitar todos" /
 * "Recusar" no banner). */
export function setAllConsent(choice: ConsentChoice) {
  storeConsent("analytics", choice);
  storeConsent("marketing", choice);
  pushConsentUpdate(choice, choice);
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: { category: "all", choice } }));
}
