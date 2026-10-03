import { readFileSync } from "node:fs";
const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const EMAIL = "bakirberke.01@gmail.com";
const h = { "api-key": env.BREVO_API_KEY, accept: "application/json", "content-type": "application/json" };

// 1) transactional blocked contact'tan çıkar
const del = await fetch(`https://api.brevo.com/v3/smtp/blockedContacts/${encodeURIComponent(EMAIL)}`, { method: "DELETE", headers: h });
console.log("unblock blockedContacts:", del.status, del.status===204?"(çıkarıldı)": await del.text());

// 2) contact emailBlacklisted=false
const upd = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(EMAIL)}`, { method: "PUT", headers: h, body: JSON.stringify({ emailBlacklisted: false }) });
console.log("contact unblacklist:", upd.status, upd.status===204?"(ok)": await upd.text());

// 3) tekrar gönder
const res = await fetch("https://api.brevo.com/v3/smtp/email", {
  method: "POST", headers: h,
  body: JSON.stringify({
    sender: { name: "Notvia", email: env.BREVO_SENDER_EMAIL },
    to: [{ email: EMAIL, name: "Berke" }],
    subject: "Notvia test — ulaştı mı?",
    htmlContent: "<p>Bu bir Notvia teslimat testidir. Bu maili gördüysen bildirim sistemi çalışıyor.</p>",
  }),
});
console.log("resend:", res.status, await res.text());
