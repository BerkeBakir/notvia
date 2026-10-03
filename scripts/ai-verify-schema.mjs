import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const l of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const a = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
for (const t of ["note_chunks", "ai_conversations", "ai_messages"]) {
  const { error } = await a.from(t).select("id", { count: "exact", head: true });
  console.log(t, error ? "HATA: " + error.message : "OK");
}
const { error: rpcErr } = await a.rpc("match_note_chunks", { query_embedding: JSON.stringify(Array(768).fill(0)), match_count: 1, filter_course_id: null });
console.log("match_note_chunks RPC", rpcErr ? "HATA: " + rpcErr.message : "OK");
