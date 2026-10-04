-- Çalışma serisi (streak): her gün aktivite gösterince artan sayaç
alter table users add column if not exists streak_count int not null default 0;
alter table users add column if not exists last_active_date date;

grant select (streak_count) on public.users to anon, authenticated;
