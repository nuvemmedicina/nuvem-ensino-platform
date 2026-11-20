/**
 * Lê o client_id do GA4 a partir do cookie `_ga`, gravado pelo próprio
 * Google quando o Consent Mode libera analytics_storage. Sem esse cookie
 * (a pessoa não aceitou o cookie de analytics, ou a tag ainda não rodou),
 * não há como correlacionar uma compra futura a um visitante na medição.
 * Não é dado pessoal: é um identificador técnico aleatório gerado pelo
 * próprio Google, sem nome, e-mail ou qualquer informação de contato.
 */
export function getGaClientId(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)_ga=([^;]+)/);
  if (!match) return null;
  const parts = match[1].split(".");
  if (parts.length < 4) return null;
  return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
}

/**
 * Lê o session_id do GA4 a partir do cookie da sessão (`_ga_<ID do fluxo>`).
 * O evento de compra é enviado pelo servidor bem depois do clique, quando a
 * Asaas confirma o pagamento; sem o session_id, o GA4 recebe a compra mas
 * não sabe a qual visita ela pertence, e a venda fica sem origem. Venda sem
 * origem nunca é importada pelo Google Ads, que só aceita conversões ligadas
 * a um clique de anúncio. Com ele, o GA4 atribui a compra à mesma sessão que
 * veio do anúncio (ver lib/ga4MeasurementProtocol.ts).
 *
 * O cookie tem dois formatos em uso: o antigo "GS1.1.<session_id>.<n>..." e
 * o novo "GS2.1.s<session_id>$o<n>$g...". Os dois são aceitos.
 */
export function getGaSessionId(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)_ga_[A-Z0-9]+=([^;]+)/);
  if (!match) return null;
  const value = decodeURIComponent(match[1]);
  const gs2 = value.match(/^GS2\.\d+\.s(\d+)/);
  if (gs2) return gs2[1];
  const parts = value.split(".");
  if (parts[0] === "GS1" && parts.length >= 3 && /^\d+$/.test(parts[2])) return parts[2];
  return null;
}
