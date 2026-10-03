-- Stüdyo çıktılarını kalıcı sakla (sayfa yenilenince kaybolmasın)
create table ai_studio_outputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  kind text not null,
  source_count int not null default 0,
  result jsonb not null,
  provider text,
  created_at timestamptz not null default now()
);

create index ai_studio_outputs_user_course_idx
  on ai_studio_outputs(user_id, course_id, created_at desc);

alter table ai_studio_outputs enable row level security;
create policy "ai_studio_own" on ai_studio_outputs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
