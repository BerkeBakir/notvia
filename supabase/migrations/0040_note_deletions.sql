-- Silinen notların kaydı: sahibi sebep belirterek sildiğinde veya moderatör kaldırdığında.
-- Not satırı silinir (dosya da depodan), bu tablo yalnızca istatistik/denetim için tutulur.
create table if not exists public.note_deletions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null,
  user_id uuid references public.users(id) on delete set null,
  course_id uuid,
  title text not null,
  deleted_by text not null check (deleted_by in ('owner','moderator')),
  reason text not null,
  detail text check (detail is null or char_length(detail) <= 500),
  created_at timestamptz not null default now()
);
create index if not exists note_deletions_created_idx on public.note_deletions (created_at desc);
alter table public.note_deletions enable row level security;
revoke all on public.note_deletions from anon, authenticated;
