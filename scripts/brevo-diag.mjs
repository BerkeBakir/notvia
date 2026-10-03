import { readFileSync } from "node:fs";
const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const h = { "api-key": env.BREVO_API_KEY, accept: "application/json" };
console.log("SENDER_EMAIL:", env.BREVO_SENDER_EMAIL);

const acc = await fetch("https://api.brevo.com/v3/account", { headers: h });
const accJson = await acc.json();
console.log("\n== ACCOUNT ==", acc.status);
console.log("plan:", JSON.stringify(accJson.plan));
console.log("email:", accJson.email);

const sndr = await fetch("https://api.brevo.com/v3/senders", { headers: h });
console.log("\n== SENDERS ==", sndr.status);
console.log(JSON.stringify(await sndr.json(), null, 2));

const ev = await fetch("https://api.brevo.com/v3/smtp/statistics/events?limit=10&email=bakirberke.01@gmail.com", { headers: h });
console.log("\n== RECENT EVENTS (bakirberke.01) ==", ev.status);
console.log(JSON.stringify(await ev.json(), null, 2));
