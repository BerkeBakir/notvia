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
    `"${title}" başlıklı bu üniversite ders notunu sınava çalışan bir öğrenci için ` +
      `Türkçe özetle. Markdown kullan ve şu yapıyı izle (notta karşılığı olmayan ` +
      `bölümü atla):\n` +
      `## Genel Bakış\n1-2 cümle: not neyi kapsıyor.\n` +
      `## Ana Konular\nHer konu için kısa madde; alt başlıklar gerekiyorsa ### kullan.\n` +
      `## Önemli Tanımlar\n- **Terim**: kısa tanım\n` +
      `## Formüller ve Kurallar\nVarsa satır içi kod biçiminde.\n` +
      `## Sınav İçin Kritik Noktalar\n3-6 madde.\n` +
      `Tablo ve HTML kullanma, kısa ve taranabilir yaz. Yalnızca özeti yaz, ekstra açıklama ekleme.`,
  );
}
