// scripts/ai-verify-embed.mjs
import { readFileSync } from "node:fs";
const env = {};
for (const l of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const { GoogleGenerativeAI } = await import("@google/generative-ai");
const model = new GoogleGenerativeAI(env.GEMINI_API_KEY).getGenerativeModel({ model: "gemini-embedding-001" });
const r = await model.embedContent({ content: { role: "user", parts: [{ text: "Veri yapıları dersinde ağaçlar konusu." }] }, outputDimensionality: 768 });
console.log("embedding boyutu:", r.embedding.values.length, r.embedding.values.length === 768 ? "OK" : "BEKLENMEDİK");
