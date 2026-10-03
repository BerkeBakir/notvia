import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { extractPdfText } from "./pdf-text";

const MODEL = "gemini-2.5-flash";
/** Bu boyuta kadar PDF doğrudan (inline) gönderilir: şekil/formül/tablo da görülür. */
const MAX_INLINE_BYTES = 15 * 1024 * 1024;
/** Yükleme limitiyle aynı; daha büyükleri hiç indirilmez. */
const MAX_PDF_BYTES = 40 * 1024 * 1024;
/** Metin yolunda modele gidecek en fazla karakter (~200k token, Flash bağlamına rahat sığar). */
const MAX_TEXT_CHARS = 600_000;

async function fetchPdf(fileUrl: string): Promise<Buffer> {
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error("PDF indirilemedi.");
  const declared = Number(res.headers.get("content-length"));
  if (declared && declared > MAX_PDF_BYTES) throw new Error("PDF çok büyük (en fazla 40MB).");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_PDF_BYTES) throw new Error("PDF çok büyük (en fazla 40MB).");
  return buf;
}

/**
 * PDF'i modele uygun parçaya çevirir.
 * Küçük PDF → olduğu gibi (inline). Büyük PDF → metni çıkarılıp düz metin olarak.
 */
async function pdfToPart(fileUrl: string): Promise<Part> {
  const buf = await fetchPdf(fileUrl);
  if (buf.byteLength <= MAX_INLINE_BYTES) {
    return { inlineData: { mimeType: "application/pdf", data: buf.toString("base64") } };
  }
  const text = await extractPdfText(buf);
  if (!text) {
    throw new Error(
      "Bu PDF büyük ve taranmış görüntülerden oluşuyor; metin çıkarılamadığı için AI işleyemiyor.",
    );
  }
  const clipped = text.length > MAX_TEXT_CHARS;
  return {
    text:
      `=== DERS NOTU METNİ (PDF'ten çıkarıldı${clipped ? ", uzunluk nedeniyle kısaltıldı" : ""}) ===\n` +
      text.slice(0, MAX_TEXT_CHARS),
  };
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

  const pdfPart = await pdfToPart(fileUrl);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL });

  const result = await model.generateContent([pdfPart, { text: prompt }]);

  return result.response.text() || null;
}
