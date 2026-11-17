/**
 * Dados que a FACOP pede para emitir o certificado: nome completo, CPF,
 * contato, e-mail e endereço completo. Em 17/11/2026 a FACOP dispensou RG e
 * naturalidade; as colunas User.rg, rgIssuer e birthplace ficaram no banco
 * com o que os primeiros alunos já tinham enviado, mas não são mais pedidas.
 *
 * A coordenação pede em lotes (/admin/certificados-facop) e o aluno
 * responde em /dashboard/dados-certificado.
 */
import { cpfValido, soDigitos } from "@/lib/cpf";

export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;

export type DadosCertificado = {
  nome: string;
  cpf: string;
  telefone: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export type CampoDados = keyof DadosCertificado;

const limpar = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/**
 * Normaliza e confere o que o aluno mandou. Devolve os campos com erro (vazio
 * quando está tudo certo). Complemento é o único campo opcional.
 */
export function validarDados(entrada: Record<string, unknown>): { dados: DadosCertificado; erros: CampoDados[] } {
  const dados: DadosCertificado = {
    nome: limpar(entrada.nome, 120),
    cpf: soDigitos(limpar(entrada.cpf, 20)),
    telefone: soDigitos(limpar(entrada.telefone, 30)),
    cep: soDigitos(limpar(entrada.cep, 12)),
    rua: limpar(entrada.rua, 120),
    numero: limpar(entrada.numero, 20),
    complemento: limpar(entrada.complemento, 60),
    bairro: limpar(entrada.bairro, 80),
    cidade: limpar(entrada.cidade, 80),
    uf: limpar(entrada.uf, 2).toUpperCase(),
  };

  const erros: CampoDados[] = [];
  const uf = (v: string) => (UFS as readonly string[]).includes(v);
  // O nome vai no certificado: nome e sobrenome, no mínimo
  if (dados.nome.split(" ").length < 2) erros.push("nome");
  if (!cpfValido(dados.cpf)) erros.push("cpf");
  if (dados.telefone.length < 10 || dados.telefone.length > 13) erros.push("telefone");
  if (dados.cep.length !== 8) erros.push("cep");
  if (dados.rua.length < 2) erros.push("rua");
  if (!dados.numero) erros.push("numero");
  if (dados.bairro.length < 2) erros.push("bairro");
  if (dados.cidade.length < 2) erros.push("cidade");
  if (!uf(dados.uf)) erros.push("uf");
  return { dados, erros };
}

type UsuarioEndereco = {
  address: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  province: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
};

/** Endereço numa linha, como a FACOP pede: "Rua X, 10 - Apto 2 - Bairro, Cidade - UF, CEP 00000-000". */
export function enderecoCompleto(u: UsuarioEndereco): string {
  if (!u.address) return "";
  const numero = u.addressNumber && u.addressNumber !== "0" ? u.addressNumber : "s/n";
  const cep = soDigitos(u.postalCode ?? "");
  return [
    `${u.address}, ${numero}`,
    u.addressComplement ? ` - ${u.addressComplement}` : "",
    u.province ? ` - ${u.province}` : "",
    u.city ? `, ${u.city}${u.state ? ` - ${u.state}` : ""}` : "",
    cep.length === 8 ? `, CEP ${cep.slice(0, 5)}-${cep.slice(5)}` : "",
  ].join("");
}
