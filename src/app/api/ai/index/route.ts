import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { indexNote } from "@/lib/ai/ingest";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // Yalnızca giriş yapmış kullanıcı tetikleyebilir
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { noteId } = await request.json().catch(() => ({}));
  if (!noteId) return NextResponse.json({ error: "noteId required" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin || !process.env.GEMINI_API_KEY) {
    return NextResponse.json({ ok: true, configured: false });
  }

  const { data: note } = await admin
    .from("notes").select("id,title,file_url,course_id,user_id,ai_indexed").eq("id", noteId).single();
  if (!note) return NextResponse.json({ ok: true, indexed: false, chunks: 0 });
  if (note.user_id !== user.id) {
    return NextResponse.json({ error: "Bu notu indeksleyemezsin." }, { status: 403 });
  }

  try {
    const result = await indexNote(admin, note);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "İndeksleme başarısız." },
      { status: 500 },
    );
  }
}
