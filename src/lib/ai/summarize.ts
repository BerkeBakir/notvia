import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = "gemini-2.0-flash";
const MAX_PDF_BYTES = 15 * 1024 * 1024; // inline istek limiti için güvenli sınır

/**
 * Bir PDF'i Google Gemini Flash ile Türkçe özetler.
 * GEMINI_API_KEY yoksa null döner (özellik yapılandırılmamış demektir).
 */
export async function summarizePdf(
  fileUrl: string,
  title: string,
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error("PDF indirilemedi.");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_PDF_BYTES) {
    throw new Error("PDF özet için çok büyük (en fazla 15MB).");
  }
  const data = buf.toString("base64");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL });

  const result = await model.generateContent([
    { inlineData: { mimeType: "application/pdf", data } },
    {
      text:
        `"${title}" başlıklı bu üniversite ders notunu Türkçe olarak özetle. ` +
        `Ana konuları, önemli tanımları ve varsa formülleri madde işaretleriyle ` +
        `vurgula. Yalnızca özeti yaz, ekstra açıklama ekleme.`,
    },
  ]);

  return result.response.text() || null;
}
