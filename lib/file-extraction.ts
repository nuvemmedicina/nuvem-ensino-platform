/* eslint-disable @typescript-eslint/no-explicit-any */
export async function extractTextFromFile(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  if (mimeType === "application/pdf" || filename.endsWith(".pdf")) {
    // DOMMatrix não existe no Node.js mas é exigido pelo pdfjs-dist; polyfill mínimo suficiente para extração de texto
    if (typeof (globalThis as any).DOMMatrix === "undefined") {
      (globalThis as any).DOMMatrix = class {};
    }
    // A v2 do pdf-parse não exporta função nenhuma como padrão — só a classe
    // PDFParse. Chamar o módulo como função dava "a is not a function" em
    // produção, derrubando tanto a geração de flashcards quanto a indexação
    // de apostilas para a Nuvete.
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const { text } = await parser.getText();
      return text;
    } finally {
      await parser.destroy();
    }
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    filename.endsWith(".docx")
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (mimeType === "text/plain" || filename.endsWith(".txt")) {
    return buffer.toString("utf8");
  }

  if (mimeType.startsWith("image/")) {
    return "__IMAGE_BINARY__";
  }

  throw new Error(`Tipo de arquivo não suportado: ${mimeType}`);
}
