-- Geri bildirim baloncuğu: öneri / soru / hata bildirimleri.
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  kind text not null check (kind in ('oneri','soru','hata','diger')),
  message text not null check (char_length(message) between 3 and 2000),
  contact text check (contact is null or char_length(contact) <= 200),
  page text check (page is null or char_length(page) <= 300),
  status text not null default 'yeni' check (status in ('yeni','okundu','cozuldu')),
  created_at timestamptz not null default now()
);
create index if not exists feedback_created_idx on public.feedback (created_at desc);
alter table public.feedback enable row level security;
-- Yazma/okuma yalnızca sunucu (service_role) üzerinden: API rotası + admin paneli
revoke all on public.feedback from anon, authenticated;
