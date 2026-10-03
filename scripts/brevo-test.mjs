// Brevo bildirim akışını uçtan uca test eder (dummy PDF yükle -> not ekle -> abonelere mail).
// Çalıştır:  node scripts/brevo-test.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// .env.local'i elle yükle
const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const DEMO_UPLOADER = "00000000-0000-0000-0000-00000000dede";

async function findCourse() {
  const { data: uni } = await admin.from("universities").select("id").ilike("name", "%Boğaziçi%").maybeSingle();
  if (!uni) throw new Error("Boğaziçi bulunamadı");
  const { data: dep } = await admin
    .from("departments").select("id").eq("university_id", uni.id).ilike("name", "%Bilgisayar%").maybeSingle();
  if (!dep) throw new Error("Bilgisayar Müh bulunamadı");
  const { data: course } = await admin
    .from("courses").select("id,name").eq("department_id", dep.id).ilike("name", "%Veri Yap%").maybeSingle();
  if (!course) throw new Error("Veri Yapıları bulunamadı");
  return course;
}

function dummyPdf(title) {
  // Minimal geçerli tek sayfalık PDF
  const text = `Notvia test notu: ${title}`;
  const body = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length ${text.length + 40}>>stream
BT /F1 20 Tf 60 760 Td (${text}) Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>
%%EOF`;
  return Buffer.from(body, "utf8");
}

async function main() {
  const course = await findCourse();
  console.log("Ders:", course.name, course.id);

  const title = `Brevo Test Notu ${new Date().toLocaleTimeString("tr-TR")}`;
  const path = `${DEMO_UPLOADER}/${Date.now()}-brevo-test.pdf`;

  const up = await admin.storage.from("notes").upload(path, dummyPdf(title), { contentType: "application/pdf" });
  if (up.error) throw new Error("Upload: " + up.error.message);
  const { data: { publicUrl } } = admin.storage.from("notes").getPublicUrl(path);

  const { data: note, error: insErr } = await admin
    .from("notes")
    .insert({
      user_id: DEMO_UPLOADER,
      title,
      description: "Brevo e-posta bildirim testi için otomatik eklenen dummy not.",
      file_url: publicUrl,
      type: "note",
      course_id: course.id,
    })
    .select("id,title,type,course_id,user_id")
    .single();
  if (insErr) throw new Error("Insert: " + insErr.message);
  console.log("Not eklendi:", note.id);

  // notify-upload mantığı
  const { data: subs } = await admin.from("course_subscriptions").select("user_id").eq("course_id", course.id);
  const userIds = (subs ?? []).map((s) => s.user_id).filter((id) => id !== note.user_id);
  console.log("Abone sayısı (yükleyen hariç):", userIds.length);
  if (userIds.length === 0) {
    console.log("Abone yok — önce bir hesapla bu derse bildirim aç.");
    return;
  }

  const { data: recipients } = await admin.from("users").select("email,name").in("id", userIds);
  const courseUrl = `${env.NEXT_PUBLIC_SITE_URL ?? "https://notvia.vercel.app"}/courses/${course.id}`;

  let sent = 0;
  for (const r of recipients ?? []) {
    if (!r.email) continue;
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: env.BREVO_SENDER_NAME || "Notvia", email: env.BREVO_SENDER_EMAIL },
        to: [{ email: r.email, name: r.name }],
        subject: `${course.name} dersine yeni ders notu eklendi`,
        htmlContent: `<div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#047857">Notvia</h2>
          <p>Merhaba ${r.name ?? ""},</p>
          <p><b>${course.name}</b> dersine yeni bir ders notu eklendi:</p>
          <p style="font-size:18px"><b>${note.title}</b></p>
          <p><a href="${courseUrl}" style="display:inline-block;background:#047857;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">İçeriği Gör</a></p>
          <p style="color:#64748b;font-size:12px">Bu dersin bildirimlerini açtığın için bu e-postayı aldın.</p>
        </div>`,
      }),
    });
    if (res.ok) { sent++; console.log("Gönderildi:", r.email); }
    else console.error("HATA", r.email, res.status, await res.text());
  }
  console.log("Toplam gönderilen:", sent);
}

main().catch((e) => { console.error(e); process.exit(1); });
