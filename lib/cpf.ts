/** Deixa só os dígitos. User.taxId é gravado assim. */
export function soDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

/** Confere os dois dígitos verificadores do CPF. Aceita com ou sem pontuação. */
export function cpfValido(valor: string): boolean {
  const cpf = soDigitos(valor);
  if (cpf.length !== 11) return false;
  // 000.000.000-00, 111.111.111-11 etc. passam na conta, mas não existem
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digito = (base: string) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (base.length + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const d1 = digito(cpf.slice(0, 9));
  const d2 = digito(cpf.slice(0, 10));
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

/** 69926654134 → 699.266.541-34 */
export function formatarCpf(valor: string): string {
  const cpf = soDigitos(valor);
  if (cpf.length !== 11) return valor;
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

/** O cadastro tem um CPF utilizável na declaração (11 dígitos). */
export function temCpf(taxId: string | null | undefined): boolean {
  return !!taxId && soDigitos(taxId).length === 11;
}
