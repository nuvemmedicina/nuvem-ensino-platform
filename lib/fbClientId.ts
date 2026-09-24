/**
 * Lê o `_fbp` (Facebook Browser ID) do navegador, gravado pelo próprio Meta
 * Pixel quando o Consent Mode libera ad_storage. Mesma lógica do
 * lib/gaClientId.ts: sem esse cookie (a pessoa não aceitou o cookie de
 * publicidade, ou o Pixel ainda não rodou), não há como correlacionar uma
 * compra futura a um visitante na medição do Meta. Não é dado pessoal: é um
 * identificador técnico gerado pelo próprio Meta, sem nome, e-mail ou
 * qualquer informação de contato.
 */
export function getFbClientId(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)_fbp=([^;]+)/);
  return match ? match[1] : null;
}
