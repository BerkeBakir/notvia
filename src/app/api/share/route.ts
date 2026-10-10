import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Örnek başına basit sınır: kullanıcı başına saatte 30 paylaşım
const hits = new Map<string, number[]>();
function limited(uid: string) {
  const now = Date.now();
  const arr = (hits.get(uid) ?? []).filter((t) => now - t < 3600_000);
  arr.push(now);
  hits.set(uid, arr);
  return arr.length > 30;
}

/** Bir notu ya da kayıtlı AI cevabını arkadaşına gönder (yalnızca eklediğin kişilere). */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.nextUrl.host) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const to = String(body.to ?? "");
  const noteId = body.noteId ? String(body.noteId) : null;
  const answerId = body.answerId ? String(body.answerId) : null;
  const msg = String(body.message ?? "").trim().slice(0, 140);

  if (!UUID.test(to) || (!noteId && !answerId) || (noteId && !UUID.test(noteId)) || (answerId && !UUID.test(answerId))) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  if (to === user.id) return NextResponse.json({ error: "Kendine gönderemezsin." }, { status: 400 });
  if (limited(user.id)) return NextResponse.json({ error: "Çok fazla paylaşım, biraz bekle." }, { status: 429 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Sunucu yapılandırılmamış." }, { status: 500 });

  // Yalnızca arkadaş listendekilere gönderebilirsin
  const { data: rel } = await admin
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("following_id", to)
    .maybeSingle();
  if (!rel) return NextResponse.json({ error: "Sadece arkadaş listendekilere gönderebilirsin." }, { status: 403 });

  const suffix = msg ? ` — "${msg}"` : "";

  if (noteId) {
    const { data: note } = await admin.from("notes").select("id,title").eq("id", noteId).is("hidden_at", null).maybeSingle();
    if (!note) return NextResponse.json({ error: "Not bulunamadı." }, { status: 404 });
    await admin.from("notifications").insert({
      user_id: to,
      type: "share",
      message: `${user.name} sana bir not gönderdi: ${note.title}${suffix}`.slice(0, 300),
      link: `/notes/${note.id}`,
    });
    return NextResponse.json({ ok: true });
  }

  const { data: ans } = await admin
    .from("ai_saved_answers")
    .select("content,sources")
    .eq("id", answerId!)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!ans) return NextResponse.json({ error: "Cevap bulunamadı." }, { status: 404 });

  const { error } = await admin.from("ai_saved_answers").insert({
    user_id: to,
    content: ans.content,
    sources: ans.sources,
    shared_by: user.id,
  });
  if (error) return NextResponse.json({ error: "Gönderilemedi." }, { status: 500 });
  await admin.from("notifications").insert({
    user_id: to,
    type: "share",
    message: `${user.name} sana bir AI cevabı gönderdi${suffix}`.slice(0, 300),
    link: "/kaydedilenler",
  });
  return NextResponse.json({ ok: true });
}
