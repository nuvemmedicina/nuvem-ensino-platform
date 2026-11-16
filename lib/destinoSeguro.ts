/**
 * Para onde mandar a pessoa depois do login ou do cadastro. Só aceita
 * caminhos do próprio site ("/checkout/x?cupom=Y"); qualquer outra coisa
 * (endereço externo, "//outro.site") volta para o painel.
 */
export function destinoSeguro(valor: string | null | undefined, padrao = "/dashboard"): string {
  if (!valor || !valor.startsWith("/") || valor.startsWith("//") || valor.startsWith("/\\")) return padrao;
  return valor;
}
