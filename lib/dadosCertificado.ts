/**
 * Dados que a FACOP pede para emitir o certificado: nome completo, RG,
 * CPF, naturalidade, contato, e-mail e endereço completo (o mesmo
 * formulário financeiro que a coordenação manda a cada turma).
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
  rg: string;
  rgOrgao: string;
  naturalidadeCidade: string;
  naturalidadeUf: string;
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

/** "Belo Horizonte - MG" → ["Belo Horizonte", "MG"]. */
export function separarCidadeUf(valor: string | null | undefined): [string, string] {
  const v = (valor ?? "").trim();
  const m = v.match(/^(.*?)\s*[-/]\s*([A-Za-z]{2})$/);
  if (m && (UFS as readonly string[]).includes(m[2].toUpperCase())) return [m[1].trim(), m[2].toUpperCase()];
  return [v, ""];
}

const limpar = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/**
 * Normaliza e confere o que o aluno mandou. Devolve os campos com erro (vazio
 * quando está tudo certo). Complemento é o único campo opcional.
 */
export function validarDados(entrada: Record<string, unknown>): { dados: DadosCertificado; erros: CampoDados[] } {
  const dados: DadosCertificado = {
    nome: limpar(entrada.nome, 120),
    cpf: soDigitos(limpar(entrada.cpf, 20)),
    rg: limpar(entrada.rg, 30),
    rgOrgao: limpar(entrada.rgOrgao, 30).toUpperCase(),
    naturalidadeCidade: limpar(entrada.naturalidadeCidade, 80),
    naturalidadeUf: limpar(entrada.naturalidadeUf, 2).toUpperCase(),
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
  if (soDigitos(dados.rg).length < 4) erros.push("rg");
  if (dados.rgOrgao.length < 2) erros.push("rgOrgao");
  if (dados.naturalidadeCidade.length < 2) erros.push("naturalidadeCidade");
  if (!uf(dados.naturalidadeUf)) erros.push("naturalidadeUf");
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

/** RG com o órgão emissor, para a planilha da FACOP: "1.076.642 (PCE-MG)". */
export function rgCompleto(rg: string | null, orgao: string | null): string {
  if (!rg) return "";
  return orgao ? `${rg} (${orgao})` : rg;
}
