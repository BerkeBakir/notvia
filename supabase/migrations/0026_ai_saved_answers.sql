-- Kullanıcının AI cevaplarını kişisel olarak kaydetmesi ("Kaydedilenler")
create table ai_saved_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  content text not null,
  sources jsonb,
  created_at timestamptz not null default now()
);
create index ai_saved_answers_user_idx on ai_saved_answers(user_id, created_at desc);
alter table ai_saved_answers enable row level security;
create policy "ai_saved_own" on ai_saved_answers
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
