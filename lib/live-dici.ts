/**
 * Live de lançamento da campanha de fim de ano do DICI, em /live.
 *
 * Os inscritos vão para LiveLead com o eventSlug abaixo e aparecem em
 * /admin/live-leads. Depois do horário de término, a página deixa de pedir
 * inscrição e manda para a página do curso, que mostra a oferta de 30%.
 */
export const LIVE_DICI = {
  eventSlug: "dici-live-novembro-2026",
  dataLabel: "Quarta, 18/11, às 19h30",
  dataCurta: "18/11 às 19h30",
  fim: new Date("2026-11-18T21:30:00-03:00"),
  courseSlug: "dici-neurogastroenterologia-2026",
} as const;

export function liveDiciEncerrada(agora = new Date()) {
  return agora > LIVE_DICI.fim;
}
