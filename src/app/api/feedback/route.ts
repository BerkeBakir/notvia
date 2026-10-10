import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBrevoEmail } from "@/lib/email/brevo";

const KINDS = ["oneri", "soru", "hata", "diger"] as const;
const KIND_LABEL: Record<(typeof KINDS)[number], string> = {
  oneri: "Öneri",
  soru: "Soru",
  hata: "Hata",
  diger: "Diğer",
};

// Saatlik sınırlar: giriş yapmış kullanıcı kimliğiyle sayılır (DB), misafir IP ile (örnek başına, en iyi çaba).
// Giriş yapmış kullanıcıya geniş sınır: aktif test edenler kısa sürede çok öneri gönderebiliyor.
const USER_HOURLY_LIMIT = 30;
const GUEST_HOURLY_LIMIT = 5;
const hits = new Map<string, number[]>();
function ipLimited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 60 * 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > GUEST_HOURLY_LIMIT;
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function POST(req: NextRequest) {
  // CSRF: yalnızca kendi sitemizden gelen istekler
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.nextUrl.host) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 403 });
  }

  let body: { kind?: string; message?: string; contact?: string; page?: string; website?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  // Bal tuzağı: botlar gizli alanı doldurur
  if (body.website) return NextResponse.json({ ok: true });

  const kind = KINDS.includes(body.kind as (typeof KINDS)[number]) ? (body.kind as (typeof KINDS)[number]) : "diger";
  const message = String(body.message ?? "").trim();
  const contact = String(body.contact ?? "").trim().slice(0, 200) || null;
  const page = String(body.page ?? "").slice(0, 300) || null;

  if (message.length < 3) return NextResponse.json({ error: "Biraz daha detay yazar mısın?" }, { status: 400 });
  if (message.length > 2000) return NextResponse.json({ error: "Mesaj en fazla 2000 karakter olabilir." }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Sunucu yapılandırılmamış." }, { status: 500 });

  const user = await getCurrentUser();
  if (!user) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "?";
    if (ipLimited(ip)) {
      return NextResponse.json(
        { error: "Çok fazla mesaj gönderdin. Giriş yaparak devam edebilir ya da biraz sonra tekrar deneyebilirsin." },
        { status: 429 },
      );
    }
  } else {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", since);
    if ((count ?? 0) >= USER_HOURLY_LIMIT) {
      return NextResponse.json(
        { error: "Bir saatte çok fazla mesaj gönderdin, biraz sonra tekrar dene. Önerilerin için teşekkürler!" },
        { status: 429 },
      );
    }
  }

  const { error } = await admin.from("feedback").insert({
    user_id: user?.id ?? null,
    kind,
    message,
    contact: contact ?? (user?.email || null),
    page,
  });
  if (error) return NextResponse.json({ error: "Kaydedilemedi, tekrar dene." }, { status: 500 });

  // Kurucuya haber ver (en iyi çaba)
  try {
    await sendBrevoEmail({
      to: process.env.FEEDBACK_EMAIL || "info@notvia.app",
      subject: `[Notvia] Yeni ${KIND_LABEL[kind].toLowerCase()}: ${message.slice(0, 50)}`,
      html: `<p><b>${KIND_LABEL[kind]}</b> — ${esc(user?.name ?? "Misafir")}${
        contact || user?.email ? ` (${esc(contact ?? user?.email ?? "")})` : ""
      }</p><p style="white-space:pre-wrap">${esc(message)}</p><p style="color:#888">Sayfa: ${esc(page ?? "-")}</p>`,
    });
  } catch {
    // mail gitmese de kayıt tamam
  }

  return NextResponse.json({ ok: true });
}
