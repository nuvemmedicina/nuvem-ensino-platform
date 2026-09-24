/**
 * Captura de atribuição de campanha (UTM + clique de anúncio do Meta),
 * modelo de primeira visita: só grava se ainda não houver nada salvo (ou se
 * o que estava salvo já expirou), nunca sobrescreve a campanha que trouxe a
 * pessoa a primeira vez com uma visita posterior sem UTM ou com outra
 * campanha. Guardado no navegador da pessoa, não em cookie de terceiro, sem
 * depender de consentimento de analytics/publicidade para a captura em si
 * (os parâmetros já estão visíveis na própria URL, quem trouxe a pessoa já
 * sabe), só o ENVIO desses dados para GA4/Meta continua condicionado ao
 * consentimento, do mesmo jeito que o resto da medição.
 */

type StoredAttribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  fbc?: string;
  savedAt: number;
};

const STORAGE_KEY = "nuvem_attribution";
const EXPIRY_MS = 90 * 24 * 60 * 60 * 1000; // 90 dias, mesma ordem de grandeza das janelas de atribuição do Google Ads e do Meta

function readStored(): StoredAttribution | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAttribution;
    if (typeof parsed.savedAt !== "number" || Date.now() - parsed.savedAt > EXPIRY_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Chamar em toda navegação. Sem efeito se já existir uma atribuição válida
 * guardada, ou se a URL atual não tiver nenhum parâmetro de campanha. */
export function captureAttribution(searchParams: URLSearchParams): void {
  if (typeof window === "undefined") return;
  if (readStored()) return;

  const utmSource = searchParams.get("utm_source") ?? undefined;
  const utmMedium = searchParams.get("utm_medium") ?? undefined;
  const utmCampaign = searchParams.get("utm_campaign") ?? undefined;
  const fbclid = searchParams.get("fbclid");

  if (!utmSource && !utmMedium && !utmCampaign && !fbclid) return;

  const data: StoredAttribution = { savedAt: Date.now() };
  if (utmSource) data.utmSource = utmSource;
  if (utmMedium) data.utmMedium = utmMedium;
  if (utmCampaign) data.utmCampaign = utmCampaign;
  // Formato que a API de Conversões do Meta espera para o parâmetro fbc.
  if (fbclid) data.fbc = `fb.1.${Date.now()}.${fbclid}`;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Armazenamento indisponível: a atribuição só vale para a sessão atual, sem persistir.
  }
}

export function getStoredAttribution(): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  fbc?: string;
} | null {
  if (typeof window === "undefined") return null;
  const stored = readStored();
  if (!stored) return null;
  const { utmSource, utmMedium, utmCampaign, fbc } = stored;
  return { utmSource, utmMedium, utmCampaign, fbc };
}
