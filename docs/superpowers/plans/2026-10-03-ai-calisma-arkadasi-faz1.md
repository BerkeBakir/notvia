# AI Çalışma Arkadaşı — Faz 1 (MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Notvia'ya, yüklenen metin katmanlı PDF notları üzerinden RAG ile çalışan, `/asistan` tam sayfasında soru-cevap + kaynak gösteren, günlük limitli ve sohbet geçmişi tutan bir AI çalışma arkadaşı eklemek.

**Architecture:** Yükleme anında PDF metni çıkarılır, parçalanır, Gemini `text-embedding-004` ile embedding'e çevrilip pgvector (`note_chunks`) tablosunda saklanır. Sorgu anında soru embedding'e çevrilir, pgvector benzerlik araması (RPC `match_note_chunks`) ile ilgili parçalar çekilir, Gemini `gemini-2.5-flash`'e bağlam olarak verilir; cevap kaynak not linkleriyle döner. Sohbetler `ai_conversations`/`ai_messages`'ta saklanır.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Supabase (pgvector), `@google/generative-ai` (0.24.1), `unpdf` (PDF metin çıkarma), `vitest` (saf mantık birim testleri), Tailwind v4, Phosphor icons.

## Global Constraints

- Tek sağlayıcı: **Gemini**. Embedding modeli `text-embedding-004` (768 boyut), sohbet modeli `gemini-2.5-flash`. Env: `GEMINI_API_KEY`.
- Yalnızca **metin katmanlı PDF** indekslenir. Metin çıkmazsa not `ai_indexed=false` işaretlenir, hata vermez.
- Erişim: ücretsiz kullanıcı **günde 5 soru**, `plan === "pro"` sınırsız.
- Anti-slop UI kuralları: **emoji yok**, ikonlar **@phosphor-icons/react**'ten, tek accent (emerald `--primary`), hand-rolled SVG ikon yok, em-dash yok.
- Tüm kullanıcıya dönük metin **Türkçe**.
- Service-role işlemleri yalnızca sunucuda (`createAdminClient`); anahtar yoksa özellik sessizce devre dışı (uygulama bozulmaz).
- Vektörler pgvector'a **JSON string** (`JSON.stringify(number[])`) olarak yazılır/geçirilir (supabase-js array'i vector'e cast etmez).
- Sık commit; her task sonunda bağımsız test edilebilir çıktı.

---

### Task 1: Veritabanı şeması (pgvector + tablolar + RPC)

**Files:**
- Create: `supabase/migrations/0015_ai_assistant.sql`

**Interfaces:**
- Produces: `note_chunks(id, note_id, course_id, content, embedding vector(768), created_at)`; `notes.ai_indexed boolean`; `ai_conversations(id, user_id, scope_type, scope_course_id, title, created_at)`; `ai_messages(id, conversation_id, role, content, sources jsonb, created_at)`; RPC `match_note_chunks(query_embedding vector(768), match_count int, filter_course_id uuid) -> table(note_id uuid, course_id uuid, content text, similarity float)`.

- [ ] **Step 1: Migration SQL dosyasını yaz**

```sql
-- supabase/migrations/0015_ai_assistant.sql
-- AI çalışma arkadaşı: pgvector tabanlı RAG için şema

create extension if not exists vector;

-- Not parçaları + embedding'leri
create table note_chunks (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references notes(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  content text not null,
  embedding vector(768) not null,
  created_at timestamptz not null default now()
);

-- Benzerlik araması için ivfflat index (cosine)
create index note_chunks_embedding_idx
  on note_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index note_chunks_course_idx on note_chunks(course_id);

-- Notun indekslenme durumu: null=denenmedi, true=indekslendi, false=metin yok
alter table notes add column if not exists ai_indexed boolean;

-- Herkes chunk'ları okuyabilir (notlar zaten public); yazma service_role ile
alter table note_chunks enable row level security;
create policy "note_chunks_select_all" on note_chunks for select using (true);

-- Sohbetler
create table ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  scope_type text not null default 'all' check (scope_type in ('all','course')),
  scope_course_id uuid references courses(id) on delete set null,
  title text,
  created_at timestamptz not null default now()
);

create table ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  sources jsonb,
  created_at timestamptz not null default now()
);

create index ai_conversations_user_idx on ai_conversations(user_id, created_at desc);
create index ai_messages_conv_idx on ai_messages(conversation_id, created_at);

alter table ai_conversations enable row level security;
alter table ai_messages enable row level security;

-- Kullanıcı yalnızca kendi sohbetlerini görür/yazar
create policy "ai_conv_own" on ai_conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "ai_msg_own" on ai_messages
  for all using (
    exists (select 1 from ai_conversations c
            where c.id = ai_messages.conversation_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from ai_conversations c
            where c.id = ai_messages.conversation_id and c.user_id = auth.uid())
  );

-- Benzerlik araması RPC'si
create or replace function match_note_chunks(
  query_embedding vector(768),
  match_count int default 8,
  filter_course_id uuid default null
)
returns table (note_id uuid, course_id uuid, content text, similarity float)
language sql stable
as $$
  select nc.note_id, nc.course_id, nc.content,
         1 - (nc.embedding <=> query_embedding) as similarity
  from note_chunks nc
  where filter_course_id is null or nc.course_id = filter_course_id
  order by nc.embedding <=> query_embedding
  limit match_count;
$$;
```

- [ ] **Step 2: Kullanıcıya migration'ı çalıştırmasını söyle**

Bu proje migration'ları Supabase SQL editöründe elle çalıştırıyor. Kullanıcıdan `supabase/migrations/0015_ai_assistant.sql` içeriğini Supabase Dashboard > SQL Editor'da çalıştırmasını iste. Başarı çıktısı: "Success. No rows returned".

- [ ] **Step 3: Doğrulama script'i ile tabloların varlığını kontrol et**

Create: `scripts/ai-verify-schema.mjs`

```js
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
```

Run: `node scripts/ai-verify-schema.mjs`
Expected: her satır `OK`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0015_ai_assistant.sql scripts/ai-verify-schema.mjs
git commit -m "feat(ai): pgvector şeması, sohbet tabloları ve benzerlik RPC'si"
```

---

### Task 2: Test altyapısı + metin parçalama (chunking)

**Files:**
- Modify: `package.json` (vitest + unpdf ekle, test script'i)
- Create: `vitest.config.ts`
- Create: `src/lib/ai/chunk.ts`
- Test: `src/lib/ai/chunk.test.ts`

**Interfaces:**
- Produces: `chunkText(text: string, opts?: { size?: number; overlap?: number }): string[]` — boş/whitespace metinde `[]` döner; varsayılan size=1500 karakter, overlap=200.

- [ ] **Step 1: Bağımlılıkları kur**

```bash
cd "D:/Claude Code/notvia"
npm install unpdf
npm install -D vitest
```

- [ ] **Step 2: vitest config yaz**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
```

package.json `scripts`'e ekle: `"test": "vitest run"`.

- [ ] **Step 3: Başarısız testi yaz**

```ts
// src/lib/ai/chunk.test.ts
import { describe, it, expect } from "vitest";
import { chunkText } from "./chunk";

describe("chunkText", () => {
  it("boş metinde boş dizi döner", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n  ")).toEqual([]);
  });

  it("kısa metni tek parça yapar", () => {
    expect(chunkText("merhaba dünya")).toEqual(["merhaba dünya"]);
  });

  it("uzun metni örtüşmeli parçalara böler", () => {
    const text = "a".repeat(3500);
    const chunks = chunkText(text, { size: 1500, overlap: 200 });
    expect(chunks.length).toBe(3);
    expect(chunks[0].length).toBe(1500);
    // örtüşme: ikinci parça birincinin son 200 karakterinden başlar
    expect(chunks[1].length).toBe(1500);
    expect(chunks[2].length).toBe(3500 - 2 * (1500 - 200));
  });
});
```

- [ ] **Step 4: Testin başarısız olduğunu doğrula**

Run: `npm test`
Expected: FAIL — "Cannot find module './chunk'".

- [ ] **Step 5: chunk.ts'i yaz**

```ts
// src/lib/ai/chunk.ts
/**
 * Bir metni örtüşmeli karakter parçalarına böler.
 * Boş/whitespace metinde boş dizi döner.
 */
export function chunkText(
  text: string,
  opts: { size?: number; overlap?: number } = {},
): string[] {
  const size = opts.size ?? 1500;
  const overlap = opts.overlap ?? 200;
  const clean = text.trim();
  if (!clean) return [];
  if (clean.length <= size) return [clean];

  const step = size - overlap;
  const chunks: string[] = [];
  for (let start = 0; start < clean.length; start += step) {
    chunks.push(clean.slice(start, start + size));
    if (start + size >= clean.length) break;
  }
  return chunks;
}
```

- [ ] **Step 6: Testin geçtiğini doğrula**

Run: `npm test`
Expected: PASS (3 test).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/ai/chunk.ts src/lib/ai/chunk.test.ts
git commit -m "feat(ai): vitest kurulumu ve metin parçalama (chunkText)"
```

---

### Task 3: PDF metin çıkarma + embedding yardımcıları

**Files:**
- Create: `src/lib/ai/pdf-text.ts`
- Create: `src/lib/ai/embed.ts`
- Create: `scripts/ai-verify-embed.mjs`

**Interfaces:**
- Consumes: Task 1 şeması; `GEMINI_API_KEY`.
- Produces: `extractPdfText(buffer: Buffer): Promise<string>` — PDF'ten tüm sayfa metnini birleştirip döndürür, metin yoksa `""`; `embedText(text: string): Promise<number[]>` ve `embedTexts(texts: string[]): Promise<number[][]>` — 768 boyutlu vektör(ler); `GEMINI_API_KEY` yoksa `embedText` throw eder ("GEMINI_API_KEY eksik").

- [ ] **Step 1: pdf-text.ts yaz**

```ts
// src/lib/ai/pdf-text.ts
import { extractText, getDocumentProxy } from "unpdf";

/**
 * PDF buffer'ından metin çıkarır. Taranmış (metin katmanı olmayan) PDF'lerde
 * boş string döner.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return (typeof text === "string" ? text : text.join("\n")).trim();
}
```

- [ ] **Step 2: embed.ts yaz**

```ts
// src/lib/ai/embed.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const EMBED_MODEL = "text-embedding-004";

function client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY eksik");
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: EMBED_MODEL });
}

/** Tek bir metni 768 boyutlu vektöre çevirir. */
export async function embedText(text: string): Promise<number[]> {
  const model = client();
  const res = await model.embedContent(text);
  return res.embedding.values;
}

/** Birden çok metni sırayla embedding'e çevirir. */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (const t of texts) out.push(await embedText(t));
  return out;
}
```

- [ ] **Step 3: Doğrulama script'i yaz**

```js
// scripts/ai-verify-embed.mjs
import { readFileSync } from "node:fs";
const env = {};
for (const l of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const { GoogleGenerativeAI } = await import("@google/generative-ai");
const model = new GoogleGenerativeAI(env.GEMINI_API_KEY).getGenerativeModel({ model: "text-embedding-004" });
const r = await model.embedContent("Veri yapıları dersinde ağaçlar konusu.");
console.log("embedding boyutu:", r.embedding.values.length, r.embedding.values.length === 768 ? "OK" : "BEKLENMEDİK");
```

Run: `node scripts/ai-verify-embed.mjs`
Expected: `embedding boyutu: 768 OK`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ai/pdf-text.ts src/lib/ai/embed.ts scripts/ai-verify-embed.mjs
git commit -m "feat(ai): PDF metin çıkarma (unpdf) ve Gemini embedding yardımcıları"
```

---

### Task 4: İndeksleme pipeline'ı (indexNote)

**Files:**
- Create: `src/lib/ai/ingest.ts`

**Interfaces:**
- Consumes: `extractPdfText` (Task 3), `embedTexts` (Task 3), `chunkText` (Task 2); bir Supabase service-role client (`SupabaseClient`).
- Produces: `indexNote(admin: SupabaseClient, note: { id: string; title: string; file_url: string; course_id: string | null }): Promise<{ indexed: boolean; chunks: number }>` — PDF indirir, metin çıkarır; metin yoksa `notes.ai_indexed=false` yazar ve `{indexed:false, chunks:0}` döner; metin varsa eski chunk'ları siler, yeni parçaları embed edip `note_chunks`'a yazar, `notes.ai_indexed=true` yazar, `{indexed:true, chunks:n}` döner.

- [ ] **Step 1: ingest.ts yaz**

```ts
// src/lib/ai/ingest.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { extractPdfText } from "./pdf-text";
import { chunkText } from "./chunk";
import { embedTexts } from "./embed";

const MAX_PDF_BYTES = 15 * 1024 * 1024;

export async function indexNote(
  admin: SupabaseClient,
  note: { id: string; title: string; file_url: string; course_id: string | null },
): Promise<{ indexed: boolean; chunks: number }> {
  const res = await fetch(note.file_url);
  if (!res.ok) throw new Error("PDF indirilemedi.");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_PDF_BYTES) {
    await admin.from("notes").update({ ai_indexed: false }).eq("id", note.id);
    return { indexed: false, chunks: 0 };
  }

  const text = await extractPdfText(buf);
  const chunks = chunkText(text);
  if (chunks.length === 0) {
    await admin.from("notes").update({ ai_indexed: false }).eq("id", note.id);
    return { indexed: false, chunks: 0 };
  }

  // Yeniden indeksleme için eski parçaları temizle (idempotent)
  await admin.from("note_chunks").delete().eq("note_id", note.id);

  const vectors = await embedTexts(chunks);
  const rows = chunks.map((content, i) => ({
    note_id: note.id,
    course_id: note.course_id,
    content: `${note.title}\n\n${content}`,
    embedding: JSON.stringify(vectors[i]),
  }));
  const { error } = await admin.from("note_chunks").insert(rows);
  if (error) throw new Error("Chunk yazılamadı: " + error.message);

  await admin.from("notes").update({ ai_indexed: true }).eq("id", note.id);
  return { indexed: true, chunks: chunks.length };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/ingest.ts
git commit -m "feat(ai): not indeksleme pipeline'ı (indexNote)"
```

---

### Task 5: İndeksleme API route'u + yükleme akışına bağlama

**Files:**
- Create: `src/app/api/ai/index/route.ts`
- Modify: `src/components/notes/UploadForm.tsx:147-156`

**Interfaces:**
- Consumes: `createAdminClient` (`src/lib/supabase/admin.ts`), `indexNote` (Task 4).
- Produces: `POST /api/ai/index` body `{ noteId }` → `{ ok: true, indexed, chunks }`; yapılandırma yoksa `{ ok:true, configured:false }`.

- [ ] **Step 1: index route'unu yaz**

```ts
// src/app/api/ai/index/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { indexNote } from "@/lib/ai/ingest";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // Yalnızca giriş yapmış kullanıcı tetikleyebilir
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { noteId } = await request.json().catch(() => ({}));
  if (!noteId) return NextResponse.json({ error: "noteId required" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin || !process.env.GEMINI_API_KEY) {
    return NextResponse.json({ ok: true, configured: false });
  }

  const { data: note } = await admin
    .from("notes").select("id,title,file_url,course_id").eq("id", noteId).single();
  if (!note) return NextResponse.json({ ok: true, indexed: false, chunks: 0 });

  try {
    const result = await indexNote(admin, note);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "indexleme hatası" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: UploadForm'da notify-upload'tan sonra index çağrısı ekle**

`src/components/notes/UploadForm.tsx` içinde, mevcut `notify-upload` fetch bloğunun (satır ~148-156) hemen ardına, aynı `try` yapısıyla ekle:

```tsx
      // AI indeksleme (best-effort, hata yüklemeyi bozmaz)
      try {
        await fetch("/api/ai/index", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ noteId: inserted.id }),
        });
      } catch {
        // indeksleme başarısız olsa da yüklemeyi tamamla
      }
```

- [ ] **Step 3: Build ile doğrula**

Run: `npm run build`
Expected: Derleme hatasız; çıktıda `ƒ /api/ai/index` route'u görünür.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/ai/index/route.ts src/components/notes/UploadForm.tsx
git commit -m "feat(ai): indeksleme API route'u ve yükleme akışına bağlama"
```

---

### Task 6: Mevcut notlar için backfill script'i

**Files:**
- Create: `scripts/ai-backfill.mjs`

**Interfaces:**
- Consumes: Task 1 şeması, Gemini embedding, unpdf. (Script, `indexNote` mantığını Node ortamında tekrarlar — TS import edemez.)
- Produces: tüm `notes` satırlarını indeksler; sonuç sayacı yazdırır.

- [ ] **Step 1: backfill script'ini yaz**

```js
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
const embedModel = new GoogleGenerativeAI(env.GEMINI_API_KEY).getGenerativeModel({ model: "text-embedding-004" });

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
      const e = await embedModel.embedContent(c);
      rows.push({ note_id: note.id, course_id: note.course_id, content: `${note.title}\n\n${c}`, embedding: JSON.stringify(e.embedding.values) });
    }
    await admin.from("note_chunks").insert(rows);
    await admin.from("notes").update({ ai_indexed: true }).eq("id", note.id);
    indexed++; console.log("INDEKSLENDI:", note.title, `(${chunks.length} parça)`);
  } catch (err) { failed++; console.error("HATA:", note.title, err.message); }
}
console.log(`\nBitti. indexed=${indexed} skipped=${skipped} failed=${failed}`);
```

- [ ] **Step 2: Backfill'i çalıştır**

Run: `node scripts/ai-backfill.mjs`
Expected: her not için `INDEKSLENDI`/`ATLANDI` satırı, sonda `Bitti. indexed=N ...`. (Demo seed notları metin katmanlı olmayabilir; ATLANDI normaldir. Test için Task 10 doğrulamasında gerçek metinli bir PDF yüklenecek.)

- [ ] **Step 3: Commit**

```bash
git add scripts/ai-backfill.mjs
git commit -m "feat(ai): mevcut notlar için embedding backfill script'i"
```

---

### Task 7: Benzerlik getirme (retrieve)

**Files:**
- Create: `src/lib/ai/retrieve.ts`

**Interfaces:**
- Consumes: RPC `match_note_chunks` (Task 1), `embedText` (Task 3).
- Produces: `retrieveContext(admin: SupabaseClient, query: string, scope: { type: "all" | "course"; courseId?: string | null }, k?: number): Promise<{ content: string; noteId: string }[]>` — soruyu embed eder, RPC ile en ilgili `k` (varsayılan 8) parçayı döndürür.

- [ ] **Step 1: retrieve.ts yaz**

```ts
// src/lib/ai/retrieve.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { embedText } from "./embed";

export async function retrieveContext(
  admin: SupabaseClient,
  query: string,
  scope: { type: "all" | "course"; courseId?: string | null },
  k = 8,
): Promise<{ content: string; noteId: string }[]> {
  const vector = await embedText(query);
  const { data, error } = await admin.rpc("match_note_chunks", {
    query_embedding: JSON.stringify(vector),
    match_count: k,
    filter_course_id: scope.type === "course" ? (scope.courseId ?? null) : null,
  });
  if (error) throw new Error("Getirme hatası: " + error.message);
  return (data ?? []).map((r: { content: string; note_id: string }) => ({
    content: r.content,
    noteId: r.note_id,
  }));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/retrieve.ts
git commit -m "feat(ai): pgvector benzerlik getirme (retrieveContext)"
```

---

### Task 8: Günlük limit sayacı

**Files:**
- Create: `src/lib/ai/limit.ts`
- Test: `src/lib/ai/limit.test.ts`

**Interfaces:**
- Consumes: `ai_messages` (Task 1).
- Produces: `FREE_DAILY_LIMIT = 5`; `remainingFor(plan: string, usedToday: number): number` (pure; pro için `Infinity`); `checkDailyLimit(admin: SupabaseClient, userId: string, plan: string): Promise<{ allowed: boolean; remaining: number }>` — bugünkü kullanıcı mesajlarını sayar.

- [ ] **Step 1: Başarısız testi yaz**

```ts
// src/lib/ai/limit.test.ts
import { describe, it, expect } from "vitest";
import { remainingFor, FREE_DAILY_LIMIT } from "./limit";

describe("remainingFor", () => {
  it("pro sınırsız", () => {
    expect(remainingFor("pro", 999)).toBe(Infinity);
  });
  it("ücretsiz kalanı doğru hesaplar", () => {
    expect(remainingFor("free", 0)).toBe(FREE_DAILY_LIMIT);
    expect(remainingFor("free", 3)).toBe(FREE_DAILY_LIMIT - 3);
  });
  it("limit aşılınca 0'ın altına inmez", () => {
    expect(remainingFor("free", 99)).toBe(0);
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu doğrula**

Run: `npm test`
Expected: FAIL — "Cannot find module './limit'".

- [ ] **Step 3: limit.ts yaz**

```ts
// src/lib/ai/limit.ts
import type { SupabaseClient } from "@supabase/supabase-js";

export const FREE_DAILY_LIMIT = 5;

/** Plana ve bugünkü kullanıma göre kalan soru hakkı. Pro = Infinity. */
export function remainingFor(plan: string, usedToday: number): number {
  if (plan === "pro") return Infinity;
  return Math.max(0, FREE_DAILY_LIMIT - usedToday);
}

/** Kullanıcının bugünkü soru sayısını sayar ve izin durumunu döndürür. */
export async function checkDailyLimit(
  admin: SupabaseClient,
  userId: string,
  plan: string,
): Promise<{ allowed: boolean; remaining: number }> {
  if (plan === "pro") return { allowed: true, remaining: Infinity };

  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const { count } = await admin
    .from("ai_messages")
    .select("id, ai_conversations!inner(user_id)", { count: "exact", head: true })
    .eq("role", "user")
    .eq("ai_conversations.user_id", userId)
    .gte("created_at", since.toISOString());

  const remaining = remainingFor(plan, count ?? 0);
  return { allowed: remaining > 0, remaining };
}
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `npm test`
Expected: PASS (chunk + limit testleri, toplam 6).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/limit.ts src/lib/ai/limit.test.ts
git commit -m "feat(ai): günlük soru limiti sayacı"
```

---

### Task 9: Sohbet motoru + chat API

**Files:**
- Create: `src/lib/ai/chat.ts`
- Create: `src/app/api/ai/chat/route.ts`

**Interfaces:**
- Consumes: `retrieveContext` (Task 7), `checkDailyLimit` (Task 8), `createAdminClient`, `getCurrentUser` (`src/lib/supabase/auth.ts`), `@google/generative-ai`.
- Produces: `answerQuestion(admin, question, scope): Promise<{ answer: string; sources: { noteId: string }[] }>`; `POST /api/ai/chat` body `{ conversationId?, scopeType, scopeCourseId?, message }` → `{ conversationId, answer, sources, remaining }` veya `{ error }` (429 limit, 401 auth, 503 yapılandırma).

- [ ] **Step 1: chat.ts yaz (RAG cevap üretimi)**

```ts
// src/lib/ai/chat.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { retrieveContext } from "./retrieve";

const CHAT_MODEL = "gemini-2.5-flash";

export async function answerQuestion(
  admin: SupabaseClient,
  question: string,
  scope: { type: "all" | "course"; courseId?: string | null },
): Promise<{ answer: string; sources: { noteId: string }[] }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY eksik");

  const context = await retrieveContext(admin, question, scope);
  if (context.length === 0) {
    return {
      answer:
        "Bu konuda indekslenmiş not bulamadım. İlgili dersten metin içeren bir PDF not yüklenmişse tekrar dene.",
      sources: [],
    };
  }

  const contextText = context
    .map((c, i) => `[Kaynak ${i + 1}]\n${c.content}`)
    .join("\n\n---\n\n");

  const prompt =
    `Sen Notvia'nın yardımsever bir çalışma arkadaşısın. Aşağıdaki ders notu ` +
    `parçalarına dayanarak öğrencinin sorusunu Türkçe, sade ve öğretici biçimde ` +
    `yanıtla. Yalnızca verilen kaynaklardaki bilgilere dayan; kaynaklarda yoksa ` +
    `bunu açıkça söyle ve uydurma.\n\n` +
    `=== KAYNAKLAR ===\n${contextText}\n\n=== SORU ===\n${question}`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: CHAT_MODEL });
  const result = await model.generateContent(prompt);
  const answer = result.response.text() || "Yanıt üretilemedi.";

  const sources = [...new Set(context.map((c) => c.noteId))].map((noteId) => ({ noteId }));
  return { answer, sources };
}
```

- [ ] **Step 2: chat route'unu yaz**

```ts
// src/app/api/ai/chat/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkDailyLimit } from "@/lib/ai/limit";
import { answerQuestion } from "@/lib/ai/chat";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });

  const admin = createAdminClient();
  if (!admin || !process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "AI yapılandırılmamış." }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const message = String(body.message ?? "").trim();
  const scopeType = body.scopeType === "course" ? "course" : "all";
  const scopeCourseId = body.scopeCourseId ?? null;
  if (!message) return NextResponse.json({ error: "Mesaj gerekli." }, { status: 400 });

  const limit = await checkDailyLimit(admin, user.id, user.plan);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Günlük ücretsiz soru hakkın doldu. Pro'ya geçerek sınırsız sor.", remaining: 0 },
      { status: 429 },
    );
  }

  // Sohbeti bul veya oluştur
  let conversationId: string = body.conversationId ?? "";
  if (!conversationId) {
    const { data: conv, error } = await admin
      .from("ai_conversations")
      .insert({
        user_id: user.id,
        scope_type: scopeType,
        scope_course_id: scopeType === "course" ? scopeCourseId : null,
        title: message.slice(0, 60),
      })
      .select("id")
      .single();
    if (error || !conv) {
      return NextResponse.json({ error: "Sohbet oluşturulamadı." }, { status: 500 });
    }
    conversationId = conv.id;
  }

  await admin.from("ai_messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: message,
  });

  let answer: string;
  let sources: { noteId: string }[];
  try {
    const r = await answerQuestion(admin, message, { type: scopeType, courseId: scopeCourseId });
    answer = r.answer;
    sources = r.sources;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Yanıtlanamadı." },
      { status: 500 },
    );
  }

  await admin.from("ai_messages").insert({
    conversation_id: conversationId,
    role: "assistant",
    content: answer,
    sources,
  });

  const after = await checkDailyLimit(admin, user.id, user.plan);
  return NextResponse.json({
    conversationId,
    answer,
    sources,
    remaining: after.remaining === Infinity ? null : after.remaining,
  });
}
```

- [ ] **Step 3: Build ile doğrula**

Run: `npm run build`
Expected: Derleme hatasız; `ƒ /api/ai/chat` görünür.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ai/chat.ts src/app/api/ai/chat/route.ts
git commit -m "feat(ai): RAG sohbet motoru ve chat API route'u"
```

---

### Task 10: /asistan sayfası + sohbet arayüzü

**Files:**
- Create: `src/app/(main)/asistan/page.tsx`
- Create: `src/components/ai/AssistantChat.tsx`
- Modify: `src/components/layout/Header.tsx` (nav'a `/asistan` linki)

**Interfaces:**
- Consumes: `POST /api/ai/chat` (Task 9), `getCurrentUser`, `createClient`.
- Produces: `/asistan` giriş gerektiren sayfa; kapsam seçici (Tüm platform / belirli ders) + mesaj akışı + kaynak linkleri + kalan hak göstergesi.

- [ ] **Step 1: AssistantChat client component'ini yaz**

```tsx
// src/components/ai/AssistantChat.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { PaperPlaneRight, Sparkle, LinkSimple } from "@phosphor-icons/react";

interface Msg {
  role: "user" | "assistant";
  content: string;
  sources?: { noteId: string }[];
}

export function AssistantChat({
  courses,
}: {
  courses: { id: string; name: string }[];
}) {
  const [scopeType, setScopeType] = useState<"all" | "course">("all");
  const [courseId, setCourseId] = useState<string>("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [notice, setNotice] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message || loading) return;
    setInput("");
    setNotice("");
    setMessages((m) => [...m, { role: "user", content: message }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationId || undefined,
          scopeType,
          scopeCourseId: scopeType === "course" ? courseId : null,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.error ?? "Hata oluştu.");
        setMessages((m) => m.slice(0, -1));
      } else {
        setConversationId(data.conversationId);
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.answer, sources: data.sources },
        ]);
        if (data.remaining !== null && data.remaining !== undefined) {
          setNotice(`Bugün kalan ücretsiz soru: ${data.remaining}`);
        }
      }
    } catch {
      setNotice("Bağlantı hatası.");
      setMessages((m) => m.slice(0, -1));
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <Sparkle size={28} weight="duotone" className="text-primary" />
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Çalışma Arkadaşı
          </h1>
          <p className="text-sm text-muted">
            Platformdaki notlara dayanarak sorularını yanıtlar.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
        <button
          onClick={() => setScopeType("all")}
          className={
            scopeType === "all"
              ? "rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
              : "rounded-full border border-border px-4 py-1.5 text-sm text-muted hover:text-foreground"
          }
        >
          Tüm platform
        </button>
        <button
          onClick={() => setScopeType("course")}
          className={
            scopeType === "course"
              ? "rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
              : "rounded-full border border-border px-4 py-1.5 text-sm text-muted hover:text-foreground"
          }
        >
          Belirli ders
        </button>
        {scopeType === "course" && (
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground"
          >
            <option value="">Ders seç...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="min-h-[300px] space-y-4 rounded-2xl border border-border bg-card p-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            Bir soru sorarak başla. Örn: &quot;Veri Yapıları&apos;nda ağaçlar nasıl çalışır?&quot;
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-sm text-primary-foreground"
                  : "max-w-[80%] rounded-2xl rounded-tl-sm border border-border bg-background px-4 py-2 text-sm text-foreground"
              }
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 border-t border-border pt-2">
                  {m.sources.map((s, j) => (
                    <Link
                      key={s.noteId}
                      href={`/notes/${s.noteId}`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <LinkSimple size={12} /> Kaynak {j + 1}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <p className="text-sm text-muted">Düşünüyor...</p>}
      </div>

      {notice && <p className="text-center text-xs text-muted">{notice}</p>}

      <form onSubmit={send} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Sorunu yaz..."
          className="flex-1 rounded-full border border-border bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary"
        />
        <button
          type="submit"
          disabled={loading}
          aria-label="Gönder"
          className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <PaperPlaneRight size={20} weight="fill" />
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: /asistan sayfasını yaz**

```tsx
// src/app/(main)/asistan/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { AssistantChat } from "@/components/ai/AssistantChat";

export const metadata = {
  title: "Çalışma Arkadaşı",
  description: "Notvia'daki notlara dayanarak sorularını yanıtlayan AI çalışma arkadaşı.",
};

export default async function AssistantPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/asistan");

  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id,name")
    .order("name");

  return <AssistantChat courses={courses ?? []} />;
}
```

- [ ] **Step 3: Header nav'ına /asistan linki ekle**

`src/components/layout/Header.tsx` içinde `/notes` linkinin (satır ~35-40) hemen ardına aynı stil sınıflarıyla ekle:

```tsx
          <Link
            href="/asistan"
            className="text-muted transition hover:text-foreground"
          >
            Asistan
          </Link>
```

(Not: çevredeki `Link`'lerin `className`'ini birebir kopyala; yukarıdaki sınıf farklıysa komşu linkin sınıfını kullan.)

- [ ] **Step 4: Build ile doğrula**

Run: `npm run build`
Expected: Derleme hatasız; `ƒ /asistan` route'u görünür.

- [ ] **Step 5: Uçtan uca manuel test**

1. `npm run dev`, tarayıcıda `/asistan`.
2. Önce test için metin katmanlı bir PDF not yükle (gerçek ders notu PDF'i), Veri Yapıları dersine. Yükleme sonrası birkaç saniye bekle (indeksleme).
3. `/asistan`'da "Belirli ders" > Veri Yapıları seç, notla ilgili bir soru sor.
4. Beklenen: notdan türetilmiş Türkçe cevap + "Kaynak 1" linki o nota gider.
5. Ücretsiz hesapla 6. soruda 429 limit mesajı: "Günlük ücretsiz soru hakkın doldu".

- [ ] **Step 6: Commit**

```bash
git add src/app/(main)/asistan/page.tsx src/components/ai/AssistantChat.tsx src/components/layout/Header.tsx
git commit -m "feat(ai): /asistan sohbet sayfası, kapsam seçici ve kaynak linkleri"
```

---

## Self-Review Notu

Spec Faz 1 kapsamı karşılandı: pgvector şeması (T1), indeksleme pipeline + yükleme bağlama (T3-T5), backfill (T6), getirme (T7), günlük limit (T8), RAG sohbet + API (T9), `/asistan` + kaynaklar + geçmiş (T1 tabloları + T9 persist + T10 UI). Streaming MVP'de yok (normal JSON yanıt); spec'teki streaming Faz 1.5 iyileştirmesi olarak ertelendi — işlevsellik tam, yalnızca yanıt anlık yerine tek seferde gelir. Faz 2 (ders sekmesi, çalışma planı, quiz) ve Faz 3 (widget, OCR, açık kaynak model) ayrı planlara bırakıldı.
