import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = "gemini-2.5-flash";
const MAX_PDF_BYTES = 15 * 1024 * 1024;

async function fetchPdfBase64(fileUrl: string): Promise<string> {
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error("PDF indirilemedi.");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_PDF_BYTES) {
    throw new Error("PDF çok büyük (en fazla 15MB).");
  }
  return buf.toString("base64");
}

/**
 * Bir PDF'i Gemini'ye verip verilen prompt ile yanıt üretir.
 * GEMINI_API_KEY yoksa null döner.
 */
export async function geminiFromPdf(
  fileUrl: string,
  prompt: string,
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const data = await fetchPdfBase64(fileUrl);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL });

  const result = await model.generateContent([
    { inlineData: { mimeType: "application/pdf", data } },
    { text: prompt },
  ]);

  return result.response.text() || null;
}
