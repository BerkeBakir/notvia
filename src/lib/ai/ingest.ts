// src/lib/ai/ingest.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { extractPdfText } from "./pdf-text";
import { chunkText } from "./chunk";
import { embedTexts } from "./embed";
import { ocrPdf, pdfPageCount } from "./ocr";

const MAX_PDF_BYTES = 40 * 1024 * 1024;

export async function indexNote(
  admin: SupabaseClient,
  note: { id: string; title: string; file_url: string; course_id: string | null },
): Promise<{ indexed: boolean; chunks: number }> {
  // SSRF koruması: yalnızca kendi Supabase storage adresimiz
  const allowedPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/`;
  if (!note.file_url || !note.file_url.startsWith(allowedPrefix)) {
    return { indexed: false, chunks: 0 };
  }

  const res = await fetch(note.file_url);
  if (!res.ok) throw new Error("PDF indirilemedi.");
  const declared = Number(res.headers.get("content-length"));
  if (declared && declared > MAX_PDF_BYTES) {
    await admin.from("notes").update({ ai_indexed: false }).eq("id", note.id);
    return { indexed: false, chunks: 0 };
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_PDF_BYTES) {
    await admin.from("notes").update({ ai_indexed: false }).eq("id", note.id);
    return { indexed: false, chunks: 0 };
  }

  let fullText = (await extractPdfText(buf)).trim();

  // Taranmış (görüntü) PDF tespiti: sayfa başına metin yoğunluğu düşükse
  // Gemini OCR ile metni çıkar (sayfa gruplarına bölerek). Metni bol olan
  // PDF'lerde çalışmaz — boşuna kota harcanmaz.
  if (process.env.GEMINI_API_KEY) {
    const pages = await pdfPageCount(buf);
    const scanned = fullText.length < 400 || (pages > 0 && fullText.length / pages < 80);
    if (scanned) {
      const ocrText = await ocrPdf(buf);
      if (ocrText) fullText = `${fullText}\n\n${ocrText}`.trim();
    }
  }

  const chunks = chunkText(fullText);
  if (chunks.length === 0) {
    await admin.from("notes").update({ ai_indexed: false }).eq("id", note.id);
    return { indexed: false, chunks: 0 };
  }

  // Metadata chunk'ı: ders/hoca gibi sorulara (ör. "öğretim üyesi kim")
  // içerik metninde geçmese de cevap verebilmek için başa eklenir.
  const meta: string[] = [`Not başlığı: ${note.title}.`];
  if (note.course_id) {
    const { data: course } = await admin
      .from("courses")
      .select("name,instructor")
      .eq("id", note.course_id)
      .maybeSingle();
    if (course?.name) meta.push(`Ders: ${course.name}.`);
    if (course?.instructor) meta.push(`Öğretim üyesi: ${course.instructor}.`);
  }
  const allChunks = [meta.join(" "), ...chunks];

  // Önce embedding: başarısız olursa mevcut indeks bozulmaz
  const vectors = await embedTexts(allChunks);

  // Yeniden indeksleme için eski parçaları temizle (idempotent)
  await admin.from("note_chunks").delete().eq("note_id", note.id);

  const rows = allChunks.map((content, i) => ({
    note_id: note.id,
    course_id: note.course_id,
    content: i === 0 ? content : `${note.title}\n\n${content}`,
    embedding: JSON.stringify(vectors[i]),
  }));
  const { error } = await admin.from("note_chunks").insert(rows);
  if (error) throw new Error("Chunk yazılamadı: " + error.message);

  await admin.from("notes").update({ ai_indexed: true }).eq("id", note.id);
  return { indexed: true, chunks: allChunks.length };
}
