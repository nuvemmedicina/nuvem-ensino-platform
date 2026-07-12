export async function extractTextFromFile(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  if (mimeType === "application/pdf" || filename.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    return result.text;
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
    // Para imagens, retorna um placeholder — o texto será extraído via visão do LLM na route
    return "__IMAGE_BINARY__";
  }

  throw new Error(`Tipo de arquivo não suportado: ${mimeType}`);
}
