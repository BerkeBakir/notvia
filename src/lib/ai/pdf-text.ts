// src/lib/ai/pdf-text.ts
import { extractText, getDocumentProxy } from "unpdf";

/**
 * PDF buffer'ından metin çıkarır. Taranmış (metin katmanı olmayan) PDF'lerde
 * boş string döner.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  // mergePages:true tek birleşik string döndürür
  const { text } = await extractText(pdf, { mergePages: true });
  return (Array.isArray(text) ? text.join("\n") : text).trim();
}
