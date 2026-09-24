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
