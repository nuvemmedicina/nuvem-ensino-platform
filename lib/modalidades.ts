/**
 * Cursos em que o aluno escolhe no checkout se vai participar presencialmente
 * ou online. O presencial tem vagas limitadas; o online, não (o Meet comporta
 * até 500 pessoas). A escolha fica em Enrollment.modalidade.
 */
export type Modalidade = "PRESENCIAL" | "ONLINE";

export type ConfigModalidade = {
  vagasPresenciais: number;
  /** Onde é a parte presencial, como aparece no checkout. */
  local: string;
};

const CURSOS: Record<string, ConfigModalidade> = {
  // Nenhum curso pergunta hoje. O teste respiratório de 12/12/2026 usou esta pergunta
  // por um dia; em 17/11 virou duas turmas separadas (presencial e online).
};

export function configModalidade(slug: string): ConfigModalidade | null {
  return CURSOS[slug] ?? null;
}

export function lerModalidade(valor: unknown): Modalidade | null {
  return valor === "PRESENCIAL" || valor === "ONLINE" ? valor : null;
}

export const ROTULO_MODALIDADE: Record<Modalidade, string> = {
  PRESENCIAL: "Presencial",
  ONLINE: "Online ao vivo",
};

/** Uma matrícula pendente só segura a vaga presencial por este tempo (o boleto vence em 3 dias úteis). */
export const DIAS_RESERVA_PENDENTE = 4;
