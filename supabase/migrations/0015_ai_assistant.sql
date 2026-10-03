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
