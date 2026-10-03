import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { extractPdfText } from "./pdf-text";
import { generateChat } from "./providers";

/** Sırayla denenir; Gemini ücretsiz kotası model başına ayrıdır. */
const GEMINI_MODELS = [
  process.env.GEMINI_PDF_MODEL || "gemini-2.5-flash",
  process.env.GEMINI_LITE_MODEL || "gemini-2.5-flash-lite",
];
/** Bu boyuta kadar PDF doğrudan (inline) gönderilir: şekil/formül/tablo da görülür. */
const MAX_INLINE_BYTES = 15 * 1024 * 1024;
/** Yükleme limitiyle aynı; daha büyükleri hiç indirilmez. */
const MAX_PDF_BYTES = 40 * 1024 * 1024;
/** Gemini metin yolunda en fazla karakter (~200k token, Flash bağlamına rahat sığar). */
const MAX_TEXT_CHARS = 600_000;
/** Diğer sağlayıcılar (Groq/Cerebras/OpenRouter/Mistral) için daha dar bağlam. */
const FALLBACK_TEXT_CHARS = 40_000;

const BUSY_MESSAGE = "AI şu anda yoğun (günlük ücretsiz kota dolmuş olabilir). Lütfen biraz sonra tekrar dene.";

async function fetchPdf(fileUrl: string): Promise<Buffer> {
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error("PDF indirilemedi.");
  const declared = Number(res.headers.get("content-length"));
  if (declared && declared > MAX_PDF_BYTES) throw new Error("PDF çok büyük (en fazla 40MB).");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_PDF_BYTES) throw new Error("PDF çok büyük (en fazla 40MB).");
  return buf;
}

/** Metni bir kez çıkarır (tembel); taranmış PDF'te anlaşılır hata verir. */
function textLoader(buf: Buffer) {
  let cached: Promise<string> | null = null;
  return () => {
    cached ??= extractPdfText(buf).then((text) => {
      if (!text) {
        throw new Error(
          "Bu PDF taranmış görüntülerden oluşuyor; metin çıkarılamadığı için AI işleyemiyor.",
        );
      }
      return text;
    });
    return cached;
  };
}

function textBlock(text: string, max: number): string {
  const clipped = text.length > max;
  return (
    `=== DERS NOTU METNİ (PDF'ten çıkarıldı${clipped ? ", uzunluk nedeniyle kısaltıldı" : ""}) ===\n` +
    text.slice(0, max)
  );
}

/**
 * Bir PDF'i AI'a verip verilen prompt ile yanıt üretir.
 * Sıra: Gemini Flash → Gemini Flash-Lite (≤15MB PDF doğrudan, büyükse metin)
 * → kota/hata olursa metin olarak diğer sağlayıcılar (Groq, Cerebras, OpenRouter, Mistral).
 * GEMINI_API_KEY yoksa null döner.
 */
export async function geminiFromPdf(
  fileUrl: string,
  prompt: string,
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const buf = await fetchPdf(fileUrl);
  const getText = textLoader(buf);
  const pdfPart: Part =
    buf.byteLength <= MAX_INLINE_BYTES
      ? { inlineData: { mimeType: "application/pdf", data: buf.toString("base64") } }
      : { text: textBlock(await getText(), MAX_TEXT_CHARS) };

  const genAI = new GoogleGenerativeAI(apiKey);
  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([pdfPart, { text: prompt }]);
      const text = result.response.text();
      if (text) return text;
    } catch (err) {
      console.warn(`[ai] PDF: "${modelName}" başarısız, sıradakine geçiliyor:`, String(err).slice(0, 180));
    }
  }

  // Gemini tükendi → metin olarak diğer sağlayıcılar
  const text = await getText();
  try {
    const r = await generateChat(`${textBlock(text, FALLBACK_TEXT_CHARS)}\n\n=== GÖREV ===\n${prompt}`, {
      skip: ["gemini"],
    });
    console.info(`[ai] PDF yanıtı yedek sağlayıcıdan: ${r.provider}`);
    return r.text;
  } catch (err) {
    console.error("[ai] PDF: tüm sağlayıcılar başarısız:", String(err).slice(0, 300));
    throw new Error(BUSY_MESSAGE);
  }
}
