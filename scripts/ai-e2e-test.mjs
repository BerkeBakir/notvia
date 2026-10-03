// AI çalışma arkadaşı uçtan uca testi: gerçek metinli PDF -> indeksle -> sorgu -> Gemini cevap
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractText, getDocumentProxy } from "unpdf";

const env = {};
for (const l of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const DEMO = "00000000-0000-0000-0000-00000000dede";

const embed = async (text) =>
  (await embedModel.embedContent({ content: { role: "user", parts: [{ text }] }, outputDimensionality: 768 })).embedding.values;

const CONTENT =
  "Ikili Arama Agaci (Binary Search Tree). Her dugumun en fazla iki cocugu vardir. " +
  "Sol alt agactaki tum degerler dugumden kucuk, sag alt agactaki tum degerler buyuktur. " +
  "Arama, ekleme ve silme islemleri ortalama O(log n) zamanda calisir. " +
  "En kotu durumda agac dengesizse O(n) olur. Dengeli agaclar AVL ve Kirmizi-Siyah bu sorunu cozer.";

function makePdf(text) {
  const lines = text.match(/.{1,70}/g);
  const stream = `BT /F1 12 Tf 50 780 Td 16 TL (${lines.join(") Tj T* (")}) Tj ET`;
  const body = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length ${stream.length}>>stream
${stream}
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>
%%EOF`;
  return Buffer.from(body, "latin1");
}

const { data: course } = await admin.from("courses").select("id,name").ilike("name", "%Veri Yap%").limit(1).maybeSingle();
console.log("Ders:", course.name, course.id);

const title = "E2E Test — Ikili Arama Agaci";
const path = `${DEMO}/${Date.now()}-e2e.pdf`;
const up = await admin.storage.from("notes").upload(path, makePdf(CONTENT), { contentType: "application/pdf" });
if (up.error) throw new Error("upload: " + up.error.message);
const { data: { publicUrl } } = admin.storage.from("notes").getPublicUrl(path);
const { data: note } = await admin.from("notes").insert({ user_id: DEMO, title, description: "e2e", file_url: publicUrl, type: "note", course_id: course.id }).select("id").single();
console.log("Not:", note.id);

// indexNote mantigi
const res = await fetch(publicUrl);
const buf = Buffer.from(await res.arrayBuffer());
const pdf = await getDocumentProxy(new Uint8Array(buf));
const { text } = await extractText(pdf, { mergePages: true });
const full = (Array.isArray(text) ? text.join("\n") : text).trim();
console.log("Cikarilan metin uzunlugu:", full.length);
if (!full) { console.error("METIN YOK"); process.exit(1); }

const vec = await embed(`${title}\n\n${full}`);
await admin.from("note_chunks").delete().eq("note_id", note.id);
const ins = await admin.from("note_chunks").insert({ note_id: note.id, course_id: course.id, content: `${title}\n\n${full}`, embedding: JSON.stringify(vec) });
if (ins.error) throw new Error("chunk insert: " + ins.error.message);
await admin.from("notes").update({ ai_indexed: true }).eq("id", note.id);
console.log("Indekslendi (1 chunk).");

// retrieve
const question = "Ikili arama agacinda arama islemi ortalama kac zamanda calisir?";
const qv = await embed(question);
const { data: matches, error: rpcErr } = await admin.rpc("match_note_chunks", { query_embedding: JSON.stringify(qv), match_count: 5, filter_course_id: course.id });
if (rpcErr) throw new Error("rpc: " + rpcErr.message);
console.log("Eslesen parca:", matches.length, "| en iyi benzerlik:", matches[0]?.similarity?.toFixed(3));

// Gemini cevap
const ctx = matches.map((m, i) => `[Kaynak ${i + 1}]\n${m.content}`).join("\n\n---\n\n");
const prompt = `Sen Notvia'nin calisma arkadasisin. Asagidaki ders notu parcalarina dayanarak soruyu Turkce yanitla. Yalnizca kaynaklara dayan.\n\n=== KAYNAKLAR ===\n${ctx}\n\n=== SORU ===\n${question}`;
const ans = await chatModel.generateContent(prompt);
console.log("\n=== SORU ===\n" + question);
console.log("\n=== CEVAP ===\n" + ans.response.text());
console.log("\n=== KAYNAK NOT ID ===", [...new Set(matches.map(m => m.note_id))]);
console.log("\nE2E BASARILI.");
