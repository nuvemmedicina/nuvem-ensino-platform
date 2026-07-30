/**
 * Cor de identidade de cada módulo — fonte única.
 *
 * Cinco módulos com o mesmo cartão branco viravam um bloco só, difícil de
 * distinguir de relance. Cada módulo passa a ter uma cor própria, usada em
 * todos os lugares em que ele aparece (currículo do aluno, player da aula,
 * página pública e painel administrativo), para que a cor vire referência:
 * "o módulo verde" passa a querer dizer alguma coisa.
 *
 * A paleta parte do petróleo da marca e avança de tons frios para quentes,
 * acompanhando a progressão do curso. Todas as cores ficam na mesma faixa de
 * saturação e luminosidade, para o conjunto parecer uma família só e manter o
 * ar clínico — nada de cor saturada de material infantil.
 *
 * Para mudar a cor de um módulo, altere apenas este arquivo.
 */

export type ModuleColor = {
  /** Cor cheia: número do módulo, barra lateral, ícones. */
  accent: string;
  /** Fundo bem claro do cabeçalho do módulo. */
  tint: string;
  /** Borda sutil, derivada do tom. */
  border: string;
  /** Nome informal, só para referência em conversa. */
  nome: string;
};

const PALETA: ModuleColor[] = [
  { accent: "#00475E", tint: "#E4EFF2", border: "#B9D5DD", nome: "petróleo" },
  { accent: "#2A4E7E", tint: "#E7ECF5", border: "#C0CCE3", nome: "azul" },
  { accent: "#2E6F5B", tint: "#E5F0EB", border: "#BEDACE", nome: "verde" },
  { accent: "#9A6212", tint: "#F6EEE1", border: "#E3CFAB", nome: "âmbar" },
  { accent: "#6B3F6E", tint: "#F0E9F1", border: "#D6C2D8", nome: "ameixa" },
];

/**
 * Cor do módulo pela posição na lista (0 = primeiro).
 * Cursos com mais módulos que a paleta repetem as cores em ciclo.
 */
export function moduleColor(index: number): ModuleColor {
  const i = ((index % PALETA.length) + PALETA.length) % PALETA.length;
  return PALETA[i];
}

/** A paleta inteira, para telas que precisam de legenda. */
export const MODULE_PALETTE = PALETA;
