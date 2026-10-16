/**
 * Aula gratuita para captar interessados no DICI: a gravação inteira do
 * 5º Encontro Síncrono, liberada em troca de nome, especialidade, WhatsApp e
 * e-mail. Quem assiste ganha 20% de desconto na matrícula.
 *
 * Os inscritos vão para LiveLead com o eventSlug abaixo (o mesmo modelo da
 * live de julho), e aparecem em /admin/live-leads.
 *
 * O vídeo é o publicado no canal da Nuvem Ensino no YouTube (decisão da
 * coordenação, 16/10/2026). Como ele é público lá, o formulário não impede
 * ninguém de assistir pelo YouTube — serve para quem chega pela página.
 */
export const AULA_GRATUITA = {
  eventSlug: "dici-aula-gratuita-5o-encontro",
  youtubeId: "KmwsN8jGwkI",
  duracaoLabel: "68 min",
  capa: "/aula-gratuita/capa-5o-encontro.jpg",
  courseSlug: "dici-neurogastroenterologia-2026",
  cupom: "AULADICI20",
  descontoPct: 20,
  titulo: "IA e o Cuidado Humano",
  encontro: "5º Encontro Síncrono",
  convidado: "Dr. Carlos Eneas Ricca",
  convidadoCargo: "Gastroenterologia e Endoscopia Digestiva",
} as const;

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Preço cheio e com o cupom, já formatados. */
export function precosAulaGratuita(precoCheio: number) {
  const comDesconto = Math.round(precoCheio * (100 - AULA_GRATUITA.descontoPct)) / 100;
  return { precoDe: brl.format(precoCheio), precoPor: brl.format(comDesconto) };
}

/** Link da matrícula com o cupom já aplicado. */
export function linkMatriculaAulaGratuita(base = "") {
  return `${base}/checkout/${AULA_GRATUITA.courseSlug}?cupom=${AULA_GRATUITA.cupom}`;
}

/** Cookie que lembra, neste navegador, que a pessoa já se inscreveu. */
export const AULA_GRATUITA_COOKIE = "nuvem_aula_gratuita";
