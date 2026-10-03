import { readFileSync } from "node:fs";
const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const h = { "api-key": env.BREVO_API_KEY, accept: "application/json" };
const ev = await fetch("https://api.brevo.com/v3/smtp/statistics/events?limit=4&email=bakirberke.01@gmail.com", { headers: h });
const j = await ev.json();
for (const e of j.events ?? []) console.log(e.date, "->", e.event, "|", e.subject);
