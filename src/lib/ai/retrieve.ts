// src/lib/ai/retrieve.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { embedText } from "./embed";

export interface AiScope {
  type: "all" | "course";
  courseId?: string | null;
  /** Çalışma alanında seçili kaynak notlar; verilirse arama bunlarla sınırlanır. */
  noteIds?: string[] | null;
}

export async function retrieveContext(
  admin: SupabaseClient,
  query: string,
  scope: AiScope,
  k = 12,
): Promise<{ content: string; noteId: string }[]> {
  const vector = await embedText(query);
  const { data, error } = await admin.rpc("match_note_chunks_v2", {
    query_embedding: JSON.stringify(vector),
    match_count: k,
    filter_course_id: scope.type === "course" ? (scope.courseId ?? null) : null,
    filter_note_ids: scope.noteIds && scope.noteIds.length > 0 ? scope.noteIds : null,
  });
  if (error) throw new Error("Getirme hatası: " + error.message);
  return (data ?? []).map((r: { content: string; note_id: string }) => ({
    content: r.content,
    noteId: r.note_id,
  }));
}

/**
 * Seçili notların parçalarını (sorgusuz) sırayla toplar — stüdyo çıktıları için.
 * Notlar arasında dönüşümlü alınır ki tek büyük not bütçeyi yutmasın.
 */
export async function collectNoteText(
  admin: SupabaseClient,
  noteIds: string[],
  maxChars = 30_000,
): Promise<{ text: string; noteIds: string[] }> {
  const { data, error } = await admin
    .from("note_chunks")
    .select("note_id,content,created_at")
    .in("note_id", noteIds)
    .order("created_at", { ascending: true });
  if (error) throw new Error("Not metni alınamadı: " + error.message);

  const byNote = new Map<string, string[]>();
  for (const r of data ?? []) {
    const list = byNote.get(r.note_id) ?? [];
    list.push(r.content);
    byNote.set(r.note_id, list);
  }

  const parts: string[] = [];
  let used = 0;
  const queues = [...byNote.values()];
  for (let round = 0; queues.some((q) => q.length > round); round++) {
    for (const q of queues) {
      const piece = q[round];
      if (!piece) continue;
      if (used + piece.length > maxChars) return { text: parts.join("\n\n---\n\n"), noteIds: [...byNote.keys()] };
      parts.push(piece);
      used += piece.length;
    }
  }
  return { text: parts.join("\n\n---\n\n"), noteIds: [...byNote.keys()] };
}
