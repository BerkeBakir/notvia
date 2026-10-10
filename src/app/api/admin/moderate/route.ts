import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, isModerator } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { removeNote } from "@/lib/notes/remove";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isModerator(user)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Sunucu yapılandırılmamış." }, { status: 503 });
  }

  const { action, noteId, reportId, feedbackId, status } = await request.json().catch(() => ({}));

  if (action === "deleteNote" && noteId) {
    // Notu ve PDF'ini sil (ilişkili şikayet/yorum/beğeni FK ile temizlenir)
    const { data: note } = await admin
      .from("notes")
      .select("id,user_id,course_id,title,file_url")
      .eq("id", noteId)
      .maybeSingle();
    if (!note) return NextResponse.json({ error: "Not bulunamadı." }, { status: 404 });
    const res = await removeNote(admin, note, { by: "moderator", reason: "moderasyon" });
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "feedbackStatus" && feedbackId && ["yeni", "okundu", "cozuldu"].includes(status)) {
    const { error } = await admin.from("feedback").update({ status }).eq("id", feedbackId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "dismissReport" && reportId) {
    const { error } = await admin.from("reports").delete().eq("id", reportId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
}
