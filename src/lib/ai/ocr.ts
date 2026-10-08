// src/lib/ai/ocr.ts
// Taranmış (görüntü) PDF'lerden Gemini görüntü-okuma ile metin çıkarır.
// Büyük dosyalar Gemini'nin tek-istek boyut limitini aşmasın diye sayfa
// gruplarına bölünür (pdf-lib, saf JS — serverless uyumlu). Maliyet için
// toplam sayfa ve batch sayısı sınırlıdır.
import { PDFDocument } from "pdf-lib";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Sırayla denenir: yoğunluk (503) / kota (429) olursa bekleyip tekrar dener, sonra yedek modele geçer
const OCR_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];
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
const PROMPTS = {
  scan:
    "Bu PDF taranmış ya da metni çok az olan ders notu sayfaları içeriyor. Önce içindeki TÜM metni olduğu gibi " +
    "düz metin olarak çıkar (transkribe et). Ardından sayfalardaki şekil, grafik, tablo ve şemaların taşıdığı " +
    "bilgiyi Türkçe açıkla (tablo değerleri, grafik eksen/eğilim, şemadaki ilişkiler); her açıklamanın başına " +
    "'Sayfa N (görsel):' yaz. Yorum ekleme, uydurma; sadece sayfada olanı ver.",
  visual:
    "Bu PDF ders slaytları. Slaytların yazılı metni zaten ayrıca çıkarıldı; senden SADECE görsel içeriği " +
    "istiyorum. Her sayfadaki şekil, grafik, tablo, şema, diyagram, formül görseli ve resimlerin taşıdığı " +
    "bilgiyi Türkçe olarak açıkla: tablo ise satır/sütun değerlerini yaz, grafik ise eksenleri, değerleri ve " +
    "eğilimi, şema/diyagram ise öğeleri ve aralarındaki ilişkiyi anlat. Her açıklamanın başına 'Sayfa N (görsel):' yaz. " +
    "Görseli olmayan ya da sadece süs/logo içeren sayfaları atla. Uydurma; görselde olmayan bilgi ekleme.",
};

async function ocrBatch(apiKey: string, bytes: Uint8Array, mode: keyof typeof PROMPTS = "scan"): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const parts = [
    { inlineData: { mimeType: "application/pdf", data: Buffer.from(bytes).toString("base64") } },
    { text: PROMPTS[mode] },
  ];
  let lastErr: unknown;
  for (const name of OCR_MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await genAI.getGenerativeModel({ model: name }).generateContent(parts);
        return result.response.text() ?? "";
      } catch (err) {
        lastErr = err;
        const msg = String(err);
        const transient = /(429|500|503)|overloaded|high demand|RESOURCE_EXHAUSTED/i.test(msg);
        if (!transient) break; // geçici değilse bu modelde ısrar etme
        await new Promise((r) => setTimeout(r, 1500 * 2 ** attempt));
      }
    }
  }
  throw lastErr;
}

/**
 * Taranmış PDF'in tamamını (sayfa gruplarına bölerek) OCR'lar.
 * GEMINI_API_KEY yoksa boş string döner.
 */
export async function ocrPdf(buffer: Buffer, mode: keyof typeof PROMPTS = "scan"): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "";
  const batches = await splitPdfIntoBatches(buffer);
  const texts: string[] = [];
  for (const b of batches) {
    try {
      const t = await ocrBatch(apiKey, b, mode);
      if (t.trim()) texts.push(t.trim());
    } catch (err) {
      // bir parça başarısız olsa diğerlerine devam (log: sessiz kalite kaybını fark edebilmek için)
      console.error("OCR parçası başarısız:", String(err).slice(0, 200));
    }
  }
  return texts.join("\n\n").trim();
}
