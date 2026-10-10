// Yükleme öncesi PDF kalite kontrolü (tarayıcıda çalışır; testte Node'da).

export type PdfCheck = { ok: true; pages: number } | { ok: false; reason: string };

/** Dosya içeriğinin SHA-256 özeti (aynı dosyanın aynı derse tekrar yüklenmesini yakalamak için). */
export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Boş, bozuk, şifreli veya PDF olmayan dosyaları yüklemeden önce yakalar. */
export async function inspectPdf(bytes: Uint8Array): Promise<PdfCheck> {
  if (bytes.length === 0) return { ok: false, reason: "Dosya boş (0 bayt)." };
  // PDF imzası ilk 1 KB içinde olmalı
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 1024));
  if (!head.includes("%PDF-")) {
    return { ok: false, reason: "Bu dosya geçerli bir PDF değil (uzantısı .pdf olsa da içeriği farklı)." };
  }

  const { PDFDocument } = await import("pdf-lib");
  let doc;
  try {
    doc = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/encrypt/i.test(msg)) {
      return { ok: false, reason: "PDF şifreli; açılamadığı için yüklenemez. Şifresiz halini yükle." };
    }
    return { ok: false, reason: "PDF bozuk ya da okunamıyor. Dosyayı yeniden dışa aktarıp tekrar dene." };
  }
  const pages = doc.getPageCount();
  if (pages === 0) return { ok: false, reason: "PDF'te hiç sayfa yok." };
  return { ok: true, pages };
}
