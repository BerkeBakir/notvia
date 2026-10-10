-- Adil kalite sıralaması + hızlı geri bildirim.

-- Wilson alt sınırı (%95): oy sayısını hesaba katan beğeni oranı. src/lib/rating.ts wilsonScore ile aynı formül.
create or replace function public.wilson_score(l int, d int) returns double precision
language sql immutable parallel safe as $$
  select case when coalesce(l, 0) + coalesce(d, 0) = 0 then 0::float8 else (
    with v as (select (coalesce(l, 0) + coalesce(d, 0))::float8 as n, coalesce(l, 0)::float8 as k)
    select (k / n + 3.8416 / (2 * n) - 1.96 * sqrt(((k / n) * (1 - k / n) + 3.8416 / (4 * n)) / n))
           / (1 + 3.8416 / n)
    from v
  ) end
$$;
alter table public.notes add column if not exists quality_score double precision
  generated always as (public.wilson_score(likes, dislikes)) stored;
create index if not exists notes_quality_idx on public.notes (quality_score desc, likes desc);

-- Tek tıkla kısa geri bildirim: okunaksız / eksik / çok iyi. Kişi başı etiket başına bir kez.
create table if not exists public.note_feedback (
  note_id uuid not null references public.notes(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  tag text not null check (tag in ('okunaksiz','eksik','cok_iyi')),
  created_at timestamptz not null default now(),
  primary key (note_id, user_id, tag)
);
alter table public.note_feedback enable row level security;
revoke all on public.note_feedback from anon, authenticated;
grant select on public.note_feedback to anon, authenticated;
grant insert, delete on public.note_feedback to authenticated;
create policy "note_feedback_select_all" on public.note_feedback for select using (true);
create policy "note_feedback_insert_own" on public.note_feedback for insert to authenticated
  with check (
    user_id = auth.uid()
    and not exists (select 1 from public.notes n where n.id = note_id and n.user_id = auth.uid())
  );
create policy "note_feedback_delete_own" on public.note_feedback for delete to authenticated
  using (user_id = auth.uid());
