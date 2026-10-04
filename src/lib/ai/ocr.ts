// src/lib/ai/ocr.ts
// Taranmış (görüntü) PDF'lerden Gemini görüntü-okuma ile metin çıkarır.
// Büyük dosyalar Gemini'nin tek-istek boyut limitini aşmasın diye sayfa
// gruplarına bölünür (pdf-lib, saf JS — serverless uyumlu). Maliyet için
// toplam sayfa ve batch sayısı sınırlıdır.
import { PDFDocument } from "pdf-lib";
import { GoogleGenerativeAI } from "@google/generative-ai";

const OCR_MODEL = "gemini-2.5-flash";
const MAX_BATCH_BYTES = 8 * 1024 * 1024; // her parça ~8MB (base64 şişmesine pay)
const MAX_OCR_PAGES = 250; // maliyet/süre sınırı: en fazla bu kadar sayfa OCR'lanır

/** PDF'i her biri ~MAX_BATCH_BYTES altında kalan sayfa gruplarına böler. */
export async function splitPdfIntoBatches(buffer: Buffer): Promise<Uint8Array[]> {
  const src = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const total = Math.min(src.getPageCount(), MAX_OCR_PAGES);
  const batches: Uint8Array[] = [];

  let start = 0;
  while (start < total) {
    // Parçaya sığdığı kadar sayfa ekle; boyut limitine gelince kapat
    let end = start;
    let lastBytes: Uint8Array | null = null;
    while (end < total) {
      const doc = await PDFDocument.create();
      const pages = await doc.copyPages(src, range(start, end + 1));
      pages.forEach((p) => doc.addPage(p));
      const bytes = await doc.save();
      if (bytes.byteLength > MAX_BATCH_BYTES && end > start) break; // bir önceki sayfaya kadar al
      lastBytes = bytes;
      end++;
    }
    if (lastBytes) batches.push(lastBytes);
    if (end === start) end = start + 1; // tek sayfa bile limiti aşıyorsa yine de ilerle
    start = end;
  }
  return batches;
}

/** PDF sayfa sayısı (taranmış tespiti için). Hata olursa 0. */
export async function pdfPageCount(buffer: Buffer): Promise<number> {
  try {
    const d = await PDFDocument.load(buffer, { ignoreEncryption: true });
    return d.getPageCount();
  } catch {
    return 0;
  }
}

function range(a: number, b: number): number[] {
  const out: number[] = [];
  for (let i = a; i < b; i++) out.push(i);
  return out;
}

/** Bir PDF parçasını Gemini'ye okutup düz metnini döndürür. */
async function ocrBatch(apiKey: string, bytes: Uint8Array): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: OCR_MODEL });
  const result = await model.generateContent([
    { inlineData: { mimeType: "application/pdf", data: Buffer.from(bytes).toString("base64") } },
    {
      text:
        "Bu PDF taranmış ders notu sayfaları içeriyor. İçindeki TÜM metni olduğu gibi, " +
        "düz metin olarak çıkar (transkribe et). Yorum ekleme, sadece metni ver.",
    },
  ]);
  return result.response.text() ?? "";
}

/**
 * Taranmış PDF'in tamamını (sayfa gruplarına bölerek) OCR'lar.
 * GEMINI_API_KEY yoksa boş string döner.
 */
export async function ocrPdf(buffer: Buffer): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "";
  const batches = await splitPdfIntoBatches(buffer);
  const texts: string[] = [];
  for (const b of batches) {
    try {
      const t = await ocrBatch(apiKey, b);
      if (t.trim()) texts.push(t.trim());
    } catch {
      // bir parça başarısız olsa diğerlerine devam
    }
  }
  return texts.join("\n\n").trim();
}
