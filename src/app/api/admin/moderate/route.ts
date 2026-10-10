import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, isModerator } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { moderateRemove, moderateRestore } from "@/lib/notes/moderation";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isModerator(user)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Sunucu yapılandırılmamış." }, { status: 503 });
  }

  const { action, noteId, reportId, feedbackId, status, reason } = await request.json().catch(() => ({}));

  if ((action === "removeNote" || action === "deleteNote") && noteId) {
    const res = await moderateRemove(admin, noteId, typeof reason === "string" ? reason.slice(0, 200) : "");
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "restoreNote" && noteId) {
    const res = await moderateRestore(admin, noteId);
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
