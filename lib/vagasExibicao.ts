/**
 * Cursos em que a página não mostra quantas vagas restam: aparece só
 * "Vagas limitadas" (ou "Vagas esgotadas" quando acabam). O limite continua
 * valendo no checkout (Course.totalSeats).
 */
const OCULTAR_NUMERO_DE_VAGAS = new Set<string>([
  // Nenhum curso hoje. O teste respiratório de 12/12/2026 usou por um dia, até deixar de ter presencial.
]);

export function mostraNumeroDeVagas(slug: string): boolean {
  return !OCULTAR_NUMERO_DE_VAGAS.has(slug);
}
