import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBrevoEmail } from "@/lib/email/brevo";

export async function POST(request: NextRequest) {
  // Sadece giriş yapmış kullanıcı tetikleyebilir
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { noteId } = await request.json().catch(() => ({}));
  if (!noteId) {
    return NextResponse.json({ error: "noteId required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    // E-posta yapılandırılmamış — sessizce geç
    return NextResponse.json({ ok: true, sent: 0, configured: false });
  }

  // Not + ders bilgisi
  const { data: note } = await admin
    .from("notes")
    .select("id,title,type,course_id,user_id")
    .eq("id", noteId)
    .single();
  if (!note || !note.course_id) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const { data: course } = await admin
    .from("courses")
    .select("name")
    .eq("id", note.course_id)
    .single();

  // Aboneler (yükleyen hariç)
  const { data: subs } = await admin
    .from("course_subscriptions")
    .select("user_id")
    .eq("course_id", note.course_id);

  const userIds = (subs ?? [])
    .map((s) => s.user_id)
    .filter((id) => id !== note.user_id);
  if (userIds.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const { data: recipients } = await admin
    .from("users")
    .select("email,name")
    .in("id", userIds);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const courseUrl = `${siteUrl}/courses/${note.course_id}`;
  const courseName = course?.name ?? "Takip ettiğin ders";
  const kind = note.type === "exam" ? "sınav sorusu" : "ders notu";

  let sent = 0;
  for (const r of recipients ?? []) {
    if (!r.email) continue;
    try {
      await sendBrevoEmail({
        to: r.email,
        toName: r.name ?? undefined,
        subject: `📚 ${courseName} dersine yeni ${kind} eklendi`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto">
            <h2 style="color:#0b1d3a">Notvia</h2>
            <p>Merhaba ${r.name ?? ""},</p>
            <p><b>${courseName}</b> dersine yeni bir ${kind} eklendi:</p>
            <p style="font-size:18px"><b>${note.title}</b></p>
            <p>
              <a href="${courseUrl}"
                 style="display:inline-block;background:#2dd4cf;color:#04121f;
                        padding:10px 18px;border-radius:8px;text-decoration:none;
                        font-weight:600">
                İçeriği Gör
              </a>
            </p>
            <p style="color:#64748b;font-size:12px">
              Bu dersin bildirimlerini açtığın için bu e-postayı aldın.
            </p>
          </div>`,
      });
      sent++;
    } catch {
      // Bir alıcıda hata olursa diğerlerine devam et
    }
  }

  return NextResponse.json({ ok: true, sent });
}
