// src/lib/ai/ingest.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { extractPdfText } from "./pdf-text";
import { chunkText } from "./chunk";
import { embedTexts } from "./embed";

const MAX_PDF_BYTES = 15 * 1024 * 1024;

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

  const text = await extractPdfText(buf);
  const chunks = chunkText(text);
  if (chunks.length === 0) {
    await admin.from("notes").update({ ai_indexed: false }).eq("id", note.id);
    return { indexed: false, chunks: 0 };
  }

  // Önce embedding: başarısız olursa mevcut indeks bozulmaz
  const vectors = await embedTexts(chunks);

  // Yeniden indeksleme için eski parçaları temizle (idempotent)
  await admin.from("note_chunks").delete().eq("note_id", note.id);

  const rows = chunks.map((content, i) => ({
    note_id: note.id,
    course_id: note.course_id,
    content: `${note.title}\n\n${content}`,
    embedding: JSON.stringify(vectors[i]),
  }));
  const { error } = await admin.from("note_chunks").insert(rows);
  if (error) throw new Error("Chunk yazılamadı: " + error.message);

  await admin.from("notes").update({ ai_indexed: true }).eq("id", note.id);
  return { indexed: true, chunks: chunks.length };
}
