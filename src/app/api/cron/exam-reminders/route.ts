import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBrevoEmail } from "@/lib/email/brevo";

export const maxDuration = 60;

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/**
 * Sınav hatırlatması: her gün çalışır; sınavına ≤3 gün kalanlara bir kez,
 * ≤1 gün kalanlara bir kez e-posta + uygulama içi bildirim gönderir.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: true, sent: 0, configured: false });

  const now = Date.now();
  const in3d = new Date(now + 3 * 86400_000).toISOString();
  const { data: exams } = await admin
    .from("exams")
    .select("id,user_id,course_id,title,kind,exam_at,location,reminded_3d,reminded_1d")
    .eq("remind", true)
    .gt("exam_at", new Date(now).toISOString())
    .lte("exam_at", in3d)
    .or("reminded_3d.eq.false,reminded_1d.eq.false");
  if (!exams?.length) return NextResponse.json({ ok: true, sent: 0 });

  const due = exams
    .map((e) => {
      const left = new Date(e.exam_at).getTime() - now;
      const stage: "1d" | "3d" | null = left <= 86400_000 ? (e.reminded_1d ? null : "1d") : e.reminded_3d ? null : "3d";
      return { ...e, stage, left };
    })
    .filter((e) => e.stage);
  if (!due.length) return NextResponse.json({ ok: true, sent: 0 });

  const userIds = [...new Set(due.map((e) => e.user_id))];
  const { data: users } = await admin.from("users").select("id,name,email").in("id", userIds);
  const userOf = new Map((users ?? []).map((u) => [u.id, u]));
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  let sent = 0;
  for (const e of due) {
    const u = userOf.get(e.user_id);
    const when = new Date(e.exam_at).toLocaleString("tr-TR", {
      timeZone: "Europe/Istanbul",
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
    const label = e.stage === "1d" ? "yarın" : `${Math.ceil(e.left / 86400_000)} gün sonra`;
    const studyUrl = e.course_id ? `${siteUrl}/courses/${e.course_id}` : `${siteUrl}/takvim`;

    await admin.from("notifications").insert({
      user_id: e.user_id,
      type: "exam",
      message: `⏰ ${e.title} ${label} (${when})`,
      link: e.course_id ? `/courses/${e.course_id}` : "/takvim",
    });

    if (u?.email && process.env.BREVO_API_KEY) {
      try {
        await sendBrevoEmail({
          to: u.email,
          toName: u.name ?? undefined,
          subject: `⏰ ${e.title} ${label}!`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto">
              <h2 style="color:#047857">Notvia</h2>
              <p>Merhaba ${esc(u.name ?? "")},</p>
              <p><b>${esc(e.title)}</b> sınavın <b>${label}</b>: ${esc(when)}${e.location ? ` · ${esc(e.location)}` : ""}.</p>
              <p>Son tekrar için dersin notları ve AI çalışma arkadaşın hazır:</p>
              <p><a href="${studyUrl}" style="display:inline-block;background:#047857;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">Çalışmaya başla →</a></p>
              <p style="color:#888;font-size:12px">Hatırlatmayı kapatmak için: ${siteUrl}/takvim</p>
            </div>`,
        });
        sent++;
      } catch {
        // bir kullanıcının maili başarısız olsa da devam
      }
    }

    await admin
      .from("exams")
      .update(e.stage === "1d" ? { reminded_1d: true, reminded_3d: true } : { reminded_3d: true })
      .eq("id", e.id);
  }

  return NextResponse.json({ ok: true, sent, due: due.length });
}
