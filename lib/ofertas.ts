import { LIVE_DICI_SLUG } from "@/lib/live-dici-promo";

/**
 * Oferta por tempo limitado na página de um curso.
 *
 * O preço do curso não muda: o desconto vem sempre por cupom, e a página só
 * mostra a condição e manda para o checkout com o cupom já aplicado. A faixa
 * entra e sai sozinha pelas datas, sem ninguém precisar lembrar de tirar.
 */
export type OfertaCurso = {
  slug: string;
  cupom: string;
  /** Desconto em %; use este OU descontoValor, conforme o cupom. */
  descontoPct?: number;
  /** Desconto em reais, para chegar a um preço redondo (ex.: de R$ 799 por R$ 699). */
  descontoValor?: number;
  parcelas: number;
  inicio: Date;
  fim: Date;
  /** Data final como aparece para o aluno, ex.: "29/11". */
  fimLabel: string;
  /** Aviso para quem chega depois do início da turma; opcional. */
  aviso?: { titulo: string; texto: string };
};

const OFERTAS: OfertaCurso[] = [
  // Campanha de fim de ano do DICI: 30% em público até a Black Friday.
  // Teste respiratório teórico-prático de 12/12 com a Health Go: de R$ 799 por R$ 699.
  {
    slug: "testes-respiratorios-h2-ch4-h2s-teorico-pratico",
    cupom: "RESPIRA100",
    descontoValor: 100,
    parcelas: 5,
    inicio: new Date("2026-11-16T00:00:00-03:00"),
    fim: new Date("2026-12-11T23:59:59-03:00"),
    fimLabel: "11/12",
  },
  {
    slug: LIVE_DICI_SLUG,
    cupom: "AINDADATEMPO",
    descontoPct: 30,
    parcelas: 5,
    inicio: new Date("2026-11-01T00:00:00-03:00"),
    fim: new Date("2026-11-29T23:59:59-03:00"),
    fimLabel: "29/11",
    aviso: {
      titulo: "Ainda dá tempo de entrar",
      texto:
        "A turma começou em agosto, mas todas as aulas ficam gravadas. Você assiste no seu ritmo e participa ao vivo do 8º encontro, em 25/11.",
    },
  },
];

/**
 * OFERTA_AGORA (só no .env.local) simula outra data, para conferir a faixa
 * antes de a oferta começar.
 */
export function ofertaAtiva(
  slug: string,
  agora = process.env.OFERTA_AGORA ? new Date(process.env.OFERTA_AGORA) : new Date(),
): OfertaCurso | null {
  return OFERTAS.find((o) => o.slug === slug && agora >= o.inicio && agora <= o.fim) ?? null;
}

/** Preço com o desconto da oferta, arredondado em centavos como no checkout. */
export function precoComOferta(preco: number, oferta: OfertaCurso): number {
  if (oferta.descontoValor) return Math.round((preco - oferta.descontoValor) * 100) / 100;
  return Math.round(preco * (100 - (oferta.descontoPct ?? 0))) / 100;
}

/** Selo do desconto: "30% OFF" ou "R$ 100 OFF". */
export function rotuloDesconto(oferta: OfertaCurso): string {
  if (oferta.descontoValor) {
    const valor = oferta.descontoValor.toLocaleString("pt-BR", { minimumFractionDigits: Number.isInteger(oferta.descontoValor) ? 0 : 2 });
    return `R$ ${valor} OFF`;
  }
  return `${oferta.descontoPct ?? 0}% OFF`;
}
