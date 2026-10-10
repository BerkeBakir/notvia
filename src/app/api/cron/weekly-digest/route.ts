import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBrevoEmail } from "@/lib/email/brevo";
import { esc } from "@/lib/email/escape";

export const maxDuration = 60;

/**
 * Haftalık özet maili: takip edilen derslere son 7 günde eklenen notları
 * abonelere e-postayla gönderir. Vercel Cron tetikler (pazartesi).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  if (!admin || !process.env.BREVO_API_KEY) {
    return NextResponse.json({ ok: true, sent: 0, configured: false });
  }

  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: newNotes } = await admin
    .from("notes")
    .select("id,title,course_id,created_at")
    .gte("created_at", since)
    .is("hidden_at", null)
    .not("course_id", "is", null);
  if (!newNotes || newNotes.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: "no new notes" });
  }

  const notesByCourse = new Map<string, { id: string; title: string }[]>();
  for (const n of newNotes) {
    const list = notesByCourse.get(n.course_id) ?? [];
    list.push({ id: n.id, title: n.title });
    notesByCourse.set(n.course_id, list);
  }
  const courseIds = [...notesByCourse.keys()];

  const [{ data: subs }, { data: courses }] = await Promise.all([
    admin.from("course_subscriptions").select("user_id,course_id").in("course_id", courseIds),
    admin.from("courses").select("id,name").in("id", courseIds),
  ]);
  const courseName = new Map((courses ?? []).map((c) => [c.id, c.name as string]));

  // Kullanıcı başına yeni notları topla
  const perUser = new Map<string, { course: string; title: string }[]>();
  for (const s of subs ?? []) {
    const notes = notesByCourse.get(s.course_id);
    if (!notes) continue;
    const list = perUser.get(s.user_id) ?? [];
    for (const n of notes) list.push({ course: courseName.get(s.course_id) ?? "Ders", title: n.title });
    perUser.set(s.user_id, list);
  }
  if (perUser.size === 0) return NextResponse.json({ ok: true, sent: 0 });

  const { data: users } = await admin
    .from("users")
    .select("id,email,name")
    .in("id", [...perUser.keys()]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  let sent = 0;
  for (const u of users ?? []) {
    if (!u.email) continue;
    const items = perUser.get(u.id) ?? [];
    if (items.length === 0) continue;
    const rows = items
      .map((i) => `<li style="margin-bottom:4px"><b>${esc(i.course)}</b>: ${esc(i.title)}</li>`)
      .join("");
    try {
      await sendBrevoEmail({
        to: u.email,
        toName: u.name ?? undefined,
        subject: `Bu hafta takip ettiğin derslere ${items.length} yeni içerik`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto">
            <h2 style="color:#047857">Notvia — Haftalık Özet</h2>
            <p>Merhaba ${esc(u.name)}, takip ettiğin derslere bu hafta eklenenler:</p>
            <ul style="padding-left:18px">${rows}</ul>
            <p><a href="${siteUrl}" style="display:inline-block;background:#047857;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Notvia'ya Git</a></p>
            <p style="color:#64748b;font-size:12px">Ders bildirimlerini açtığın için bu e-postayı aldın.</p>
          </div>`,
      });
      sent++;
    } catch {
      // bir alıcıda hata diğerlerini durdurmasın
    }
  }

  return NextResponse.json({ ok: true, sent });
}
