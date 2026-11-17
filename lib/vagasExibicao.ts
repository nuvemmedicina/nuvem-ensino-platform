/**
 * Cursos em que a página não mostra quantas vagas restam: aparece só
 * "Vagas limitadas" (ou "Vagas esgotadas" quando acabam). O limite continua
 * valendo no checkout (Course.totalSeats).
 */
const OCULTAR_NUMERO_DE_VAGAS = new Set<string>([
  // Teste respiratório presencial de 12/12/2026: pedido da Dra. Vera (17/11/2026).
  "testes-respiratorios-h2-ch4-h2s-teorico-pratico",
]);

export function mostraNumeroDeVagas(slug: string): boolean {
  return !OCULTAR_NUMERO_DE_VAGAS.has(slug);
}
