import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { embedText } from "@/lib/ai/embed";

export const maxDuration = 30;

type NoteRow = {
  id: string;
  title: string;
  courses: { name: string; departments: { universities: { name: string } | null } | null } | null;
};

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });

  const admin = createAdminClient();
  if (!admin || !process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "AI yapılandırılmamış." }, { status: 503 });
  }

  const q = String((await request.json().catch(() => ({})))?.query ?? "").trim();
  if (!q) return NextResponse.json({ error: "Arama metni gerekli." }, { status: 400 });
  if (q.length > 300) return NextResponse.json({ error: "Arama çok uzun." }, { status: 400 });

  let vector: number[];
  try {
    vector = await embedText(q);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Arama yapılamadı, tekrar dene." }, { status: 500 });
  }

  const { data: matches } = await admin.rpc("match_note_chunks_v2", {
    query_embedding: JSON.stringify(vector),
    match_count: 24,
    filter_course_id: null,
    filter_note_ids: null,
  });

  // Not başına en iyi benzerlik
  const best = new Map<string, number>();
  for (const m of (matches ?? []) as { note_id: string; similarity: number }[]) {
    if (!best.has(m.note_id)) best.set(m.note_id, m.similarity);
  }
  // Alakasız kuyruğu kes: en iyi sonuca göre göreli eşik + mutlak taban
  const top = Math.max(0, ...best.values());
  const cutoff = Math.max(0.6, top - 0.08);
  const noteIds = [...best.entries()].filter(([, s]) => s >= cutoff).map(([id]) => id).slice(0, 8);
  if (noteIds.length === 0) return NextResponse.json({ results: [] });

  const { data: notes } = await admin
    .from("notes")
    .select("id,title,courses(name,departments(universities(name)))")
    .in("id", noteIds);

  const results = ((notes ?? []) as unknown as NoteRow[])
    .map((n) => ({
      noteId: n.id,
      title: n.title,
      course: n.courses?.name ?? "",
      university: n.courses?.departments?.universities?.name ?? "",
      similarity: best.get(n.id) ?? 0,
    }))
    .sort((a, b) => b.similarity - a.similarity);

  return NextResponse.json({ results });
}
