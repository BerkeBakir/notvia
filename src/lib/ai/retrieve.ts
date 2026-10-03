// src/lib/ai/retrieve.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { embedText } from "./embed";

export async function retrieveContext(
  admin: SupabaseClient,
  query: string,
  scope: { type: "all" | "course"; courseId?: string | null },
  k = 12,
): Promise<{ content: string; noteId: string }[]> {
  const vector = await embedText(query);
  const { data, error } = await admin.rpc("match_note_chunks", {
    query_embedding: JSON.stringify(vector),
    match_count: k,
    filter_course_id: scope.type === "course" ? (scope.courseId ?? null) : null,
  });
  if (error) throw new Error("Getirme hatası: " + error.message);
  return (data ?? []).map((r: { content: string; note_id: string }) => ({
    content: r.content,
    noteId: r.note_id,
  }));
}
