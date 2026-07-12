/* eslint-disable @typescript-eslint/no-explicit-any */
export async function extractTextFromFile(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  if (mimeType === "application/pdf" || filename.endsWith(".pdf")) {
    // pdf-parse v2 é ESM puro — não tem .default; usamos `any` para contornar o tipo
    const pdfParse = (await import("pdf-parse")) as any;
    const fn = pdfParse.default ?? pdfParse;
    const result = await fn(buffer);
    return result.text as string;
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
