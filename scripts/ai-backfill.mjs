// scripts/ai-backfill.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractText, getDocumentProxy } from "unpdf";

const env = {};
for (const l of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const embedModel = new GoogleGenerativeAI(env.GEMINI_API_KEY).getGenerativeModel({ model: "gemini-embedding-001" });
const embed = (text) => embedModel.embedContent({ content: { role: "user", parts: [{ text }] }, outputDimensionality: 768 });

function chunkText(text, size = 1500, overlap = 200) {
  const clean = text.trim(); if (!clean) return [];
  if (clean.length <= size) return [clean];
  const step = size - overlap, out = [];
  for (let s = 0; s < clean.length; s += step) { out.push(clean.slice(s, s + size)); if (s + size >= clean.length) break; }
  return out;
}

const { data: notes } = await admin.from("notes").select("id,title,file_url,course_id");
let indexed = 0, skipped = 0, failed = 0;
for (const note of notes ?? []) {
  try {
    const res = await fetch(note.file_url);
    if (!res.ok) { failed++; continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: true });
    const full = (typeof text === "string" ? text : text.join("\n")).trim();
    const chunks = chunkText(full);
    if (chunks.length === 0) {
      await admin.from("notes").update({ ai_indexed: false }).eq("id", note.id);
      skipped++; console.log("ATLANDI (metin yok):", note.title); continue;
    }
    await admin.from("note_chunks").delete().eq("note_id", note.id);
    const rows = [];
    for (const c of chunks) {
      const e = await embed(c);
      rows.push({ note_id: note.id, course_id: note.course_id, content: `${note.title}\n\n${c}`, embedding: JSON.stringify(e.embedding.values) });
    }
    await admin.from("note_chunks").insert(rows);
    await admin.from("notes").update({ ai_indexed: true }).eq("id", note.id);
    indexed++; console.log("INDEKSLENDI:", note.title, `(${chunks.length} parça)`);
  } catch (err) { failed++; console.error("HATA:", note.title, err.message); }
}
console.log(`\nBitti. indexed=${indexed} skipped=${skipped} failed=${failed}`);
