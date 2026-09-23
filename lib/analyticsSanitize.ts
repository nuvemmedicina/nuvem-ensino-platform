/**
 * Sanitização de URL para a camada de medição (GA4 via GTM, PostHog).
 *
 * Regra: nenhum parâmetro de busca chega ao GA4 ou ao PostHog, exceto os de
 * origem (utm_*). Rotas da área do aluno, do admin, do instrutor, de
 * checkout e de autenticação nunca enviam parâmetro nenhum, nem os
 * permitidos, porque podem carregar identificador de sessão de pagamento,
 * e-mail em callbackUrl ou código de convite.
 */

const ALLOWED_QUERY_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
]);

const SENSITIVE_PATH_PREFIXES = [
  "/dashboard",
  "/admin",
  "/instrutor",
  "/checkout",
  "/entrar",
  "/cadastro",
  "/esqueci-senha",
  "/resetar-senha",
  "/verificar-email",
];

function stripLocalePrefix(pathname: string): string {
  const match = pathname.match(/^\/(en|es)(\/.*)?$/);
  return match ? match[2] || "/" : pathname;
}

export function isSensitivePath(pathname: string): boolean {
  const stripped = stripLocalePrefix(pathname);
  return SENSITIVE_PATH_PREFIXES.some(
    (prefix) => stripped === prefix || stripped.startsWith(`${prefix}/`)
  );
}

function filterParams(pathname: string, params: URLSearchParams): URLSearchParams {
  const kept = new URLSearchParams();
  if (isSensitivePath(pathname)) return kept;
  for (const [key, value] of params) {
    if (ALLOWED_QUERY_PARAMS.has(key)) kept.set(key, value);
  }
  return kept;
}

/** Recebe o pathname e a query string (sem o domínio) do App Router. */
export function sanitizePathAndSearch(pathname: string, search: string): string {
  const params = filterParams(pathname, new URLSearchParams(search));
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/** Sanitiza uma URL absoluta, como document.referrer. Retorna undefined se a
 * URL não puder ser interpretada, em vez de arriscar enviar o valor cru. */
export function sanitizeAbsoluteUrl(absoluteUrl: string): string | undefined {
  if (!absoluteUrl) return undefined;
  try {
    const url = new URL(absoluteUrl);
    const params = filterParams(url.pathname, url.searchParams);
    url.search = params.toString();
    return url.toString();
  } catch {
    return undefined;
  }
}
