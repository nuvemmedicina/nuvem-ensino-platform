/**
 * Telefones são gravados sem padronização (com DDI, sem DDI, com máscara).
 * Estas funções normalizam na hora de exibir e de exportar.
 */

/** Só os dígitos, com DDI 55 na frente — formato que o WhatsApp aceita em link. */
export function toWhatsApp(raw: string | null | undefined): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

/** Exibição legível: (11) 96858-7840. Devolve o original se não reconhecer o formato. */
export function formatPhone(raw: string | null | undefined): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return "";

  const semDdi = digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;
  const ddd = semDdi.slice(0, 2);
  const resto = semDdi.slice(2);

  if (resto.length === 9) return `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5)}`;
  if (resto.length === 8) return `(${ddd}) ${resto.slice(0, 4)}-${resto.slice(4)}`;
  return raw ?? "";
}
