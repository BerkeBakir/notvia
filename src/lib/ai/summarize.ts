import { geminiFromPdf } from "./gemini";

/**
 * Bir PDF'i Google Gemini Flash ile Türkçe özetler.
 * 15MB'a kadar PDF doğrudan, daha büyükleri metne çevrilerek gönderilir (en fazla 40MB).
 * GEMINI_API_KEY yoksa null döner (özellik yapılandırılmamış demektir).
 */
export async function summarizePdf(
  fileUrl: string,
  title: string,
): Promise<string | null> {
  return geminiFromPdf(
    fileUrl,
    `"${title}" başlıklı bu üniversite ders notunu Türkçe olarak özetle. ` +
      `Ana konuları, önemli tanımları ve varsa formülleri madde işaretleriyle ` +
      `vurgula. Yalnızca özeti yaz, ekstra açıklama ekleme.`,
  );
}
