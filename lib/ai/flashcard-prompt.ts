/**
 * Prompt e preparo do material para a geração de flashcards.
 *
 * Fica separado dos provedores porque os três (Anthropic, OpenAI, Google)
 * usavam cópias idênticas do mesmo texto — mudar o prompt exigia lembrar de
 * mudar em três arquivos.
 */

export const SYSTEM_PROMPT = `Você é um especialista em medicina que cria flashcards educacionais para médicos em formação.

FORMATO
- Cada flashcard tem "front" (pergunta) e "back" (resposta).
- A pergunta deve ser específica e se sustentar sozinha, sem depender de contexto externo para ser entendida.
- A resposta deve ser completa e enxuta: de uma a quatro frases, ou uma lista curta quando o conteúdo for enumerável.

FIDELIDADE AO MATERIAL — a regra mais importante
- Use exclusivamente o material fornecido. Não complemente com conhecimento geral, nem com o que você sabe de outras fontes.
- Se o material não trata de algum assunto, simplesmente não crie flashcard sobre ele.
- Preserve termos, siglas e classificações exatamente como aparecem no material. Nunca troque uma sigla por outra que pareça parecida, nem "corrija" a nomenclatura do autor.
- Na dúvida sobre o que o material quis dizer, prefira não criar o flashcard a criar um impreciso.

EVITE
- Perguntas vagas do tipo "O que é importante saber sobre X?"
- Perguntas cuja resposta seja apenas sim ou não
- Dois flashcards cobrindo o mesmo ponto
- Referências ao próprio documento ("segundo o texto", "conforme a apostila")

Responda APENAS com um array JSON estrito no formato [{ "front": "...", "back": "..." }], sem nenhum texto fora do JSON.`;

/** Teto de caracteres do material enviado ao modelo numa chamada. */
const ORCAMENTO_CARACTERES = 60_000;

/** Em quantas partes o documento é apresentado ao modelo. */
const PARTES = 10;

/**
 * Prepara o material preservando começo, meio e fim.
 *
 * Antes o código fazia `fileContent.slice(0, 60000)`: numa apostila longa o
 * final era descartado em silêncio e os flashcards saíam todos concentrados
 * nas primeiras páginas. Aqui o documento é dividido em partes numeradas; se
 * não couber inteiro, tira-se uma amostra proporcional de cada parte, em vez
 * de cortar tudo o que vem depois do limite.
 */
export function prepararMaterial(texto: string): { material: string; truncado: boolean } {
  const limpo = texto.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const rotular = (partes: string[]) =>
    partes.map((p, i) => `[Parte ${i + 1} de ${partes.length}]\n${p}`).join("\n\n");

  const partes: string[] = [];

  if (limpo.length <= ORCAMENTO_CARACTERES) {
    // Cabe inteiro: partes contíguas, sem perder um caractere.
    const passo = Math.ceil(limpo.length / PARTES);
    for (let i = 0; i < limpo.length; i += passo) {
      const pedaco = limpo.slice(i, i + passo).trim();
      if (pedaco) partes.push(pedaco);
    }
    return { material: rotular(partes), truncado: false };
  }

  // Não cabe: janelas espalhadas pelo documento. A primeira começa no início
  // e a última termina no fim — senão o desfecho da apostila ficaria de fora,
  // que é justamente o defeito que se quis corrigir.
  const janela = Math.floor(ORCAMENTO_CARACTERES / PARTES);
  const ultimoInicio = limpo.length - janela;
  for (let i = 0; i < PARTES; i++) {
    const inicio = Math.round((ultimoInicio * i) / (PARTES - 1));
    const pedaco = limpo.slice(inicio, inicio + janela).trim();
    if (pedaco) partes.push(pedaco);
  }
  return { material: rotular(partes), truncado: true };
}

export function montarPrompt(fileContent: string, count: number): string {
  const { material, truncado } = prepararMaterial(fileContent);

  return [
    `Gere exatamente ${count} flashcards a partir do material abaixo.`,
    ``,
    `O material está dividido em partes numeradas. Distribua os flashcards por todas elas, de modo equilibrado — não concentre nas primeiras.`,
    truncado
      ? `Cada parte é uma amostra de um documento maior; cubra o que estiver presente e ignore os cortes entre trechos.`
      : ``,
    ``,
    material,
  ].filter(Boolean).join("\n");
}

/** Espaço de resposta proporcional à quantidade pedida. */
export function tokensDeSaida(count: number): number {
  return Math.min(16_000, 1_000 + count * 160);
}
