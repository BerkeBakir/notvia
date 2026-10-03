import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/auth";
import { summarizePdf } from "@/lib/ai/summarize";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
  }
  if (user.plan !== "pro") {
    return NextResponse.json(
      { error: "AI özet yalnızca Pro üyelere açıktır." },
      { status: 403 },
    );
  }

  const { noteId } = await request.json().catch(() => ({}));
  if (!noteId) {
    return NextResponse.json({ error: "noteId gerekli." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: note } = await supabase
    .from("notes")
    .select("id, title, file_url")
    .eq("id", noteId)
    .single();
  if (!note) {
    return NextResponse.json({ error: "Not bulunamadı." }, { status: 404 });
  }

  const admin = createAdminClient();

  // Önbellekte var mı?
  if (admin) {
    const { data: cached } = await admin
      .from("note_summaries")
      .select("summary")
      .eq("note_id", noteId)
      .maybeSingle();
    // Başlıklı (yeni biçim) olmayan eski özetler bir kez yeniden üretilir (upsert ile güncellenir)
    if (cached && cached.summary.includes("## ")) {
      return NextResponse.json({ summary: cached.summary, cached: true });
    }
  }

  let summary: string | null;
  try {
    summary = await summarizePdf(note.file_url, note.title);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Özet oluşturulamadı." },
      { status: 500 },
    );
  }

  if (!summary) {
    return NextResponse.json(
      { error: "AI yapılandırılmamış (GEMINI_API_KEY eksik)." },
      { status: 503 },
    );
  }

  if (admin) {
    await admin.from("note_summaries").upsert({ note_id: noteId, summary });
  }

  return NextResponse.json({ summary });
}
