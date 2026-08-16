/**
 * Os AudioCasts ficam hospedados no Google Drive e a coordenação cadastra o
 * link de compartilhamento (…/file/d/<id>/view). Esse endereço devolve a
 * PÁGINA do Drive em HTML: o <audio> recebe text/html no lugar do arquivo e o
 * player mostra "Erro" — foi o que aconteceu no iPhone.
 *
 * O endereço de download direto devolve audio/mpeg com Accept-Ranges: bytes,
 * que é o que o Safari do iOS exige para tocar (ele pede o arquivo em faixas).
 *
 * Converter aqui, e não no banco, faz o link continuar valendo quando alguém
 * colar de novo o endereço de compartilhamento — que é o que o Drive oferece
 * no botão de copiar.
 */

/** Extrai o ID do arquivo das várias formas de link do Drive. */
function driveFileId(url: string): string | null {
  const path = url.match(/\/file\/d\/([\w-]+)/); // .../file/d/<id>/view
  if (path) return path[1];
  const query = url.match(/[?&]id=([\w-]+)/); // /uc?id=<id>, /open?id=<id>
  if (query && /(^|\.)google\.com\//.test(url)) return query[1];
  return null;
}

/** URL que o <audio> consegue tocar. Endereços que não são do Drive passam intactos. */
export function audiocastSrc(url: string): string {
  const id = driveFileId(url);
  return id
    ? `https://drive.usercontent.google.com/download?id=${id}&export=download`
    : url;
}
