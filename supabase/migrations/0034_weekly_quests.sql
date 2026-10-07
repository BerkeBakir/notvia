-- Haftalık görevler: her pazartesi (İstanbul saati) sıfırlanır; tamamlanan görevin ödülü "al" ile puana eklenir.
alter table public.likes add column if not exists created_at timestamptz not null default now();

create table if not exists public.weekly_quest_claims (
  user_id uuid not null references public.users(id) on delete cascade,
  week_start date not null,
  quest_key text not null,
  points int not null check (points between 0 and 100),
  created_at timestamptz not null default now(),
  primary key (user_id, week_start, quest_key)
);
alter table public.weekly_quest_claims enable row level security;
drop policy if exists wqc_select on public.weekly_quest_claims;
create policy wqc_select on public.weekly_quest_claims for select using (true);
revoke all on public.weekly_quest_claims from anon, authenticated;
grant select on public.weekly_quest_claims to anon, authenticated;

create or replace function public.quest_week_start()
returns date language sql stable set search_path = '' as $$
  select (date_trunc('week', now() at time zone 'Europe/Istanbul'))::date;
$$;

-- Bu haftanın görevleri ve ilerleme (yalnızca çağıranın kendisi için)
create or replace function public.weekly_quest_progress()
returns table (quest_key text, progress int, target int, points int, claimed boolean)
language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  ws date := public.quest_week_start();
  ws_ts timestamptz := (ws::timestamp at time zone 'Europe/Istanbul');
  base int;
begin
  if uid is null then return; end if;
  return query
  with q(k, p, t, pts) as (
    values
      ('upload',  (select count(*)::int from public.notes where user_id = uid and created_at >= ws_ts), 1, 15),
      ('comment', (select count(*)::int from public.comments where user_id = uid and created_at >= ws_ts), 3, 10),
      ('like',    (select count(*)::int from public.likes where user_id = uid and created_at >= ws_ts), 5, 5),
      ('ai',      (select coalesce(sum(count), 0)::int from public.ai_daily_usage where user_id = uid and day >= ws), 5, 10),
      ('friend',  (select count(*)::int from public.follows where follower_id = uid and created_at >= ws_ts), 1, 5),
      ('streak',  (select coalesce(streak_count, 0)::int from public.users where id = uid), 5, 10)
  )
  select q.k, least(q.p, q.t), q.t, q.pts,
         exists (select 1 from public.weekly_quest_claims c where c.user_id = uid and c.week_start = ws and c.quest_key = q.k)
  from q;
  -- Bonus: tüm görevler tamamlandıysa
  select count(*) into base from public.weekly_quest_claims c
   where c.user_id = uid and c.week_start = ws and c.quest_key <> 'all';
  return query select 'all'::text, base, 6, 20,
    exists (select 1 from public.weekly_quest_claims c where c.user_id = uid and c.week_start = ws and c.quest_key = 'all');
end; $$;

-- Ödülü al: ilerleme sunucuda doğrulanır
create or replace function public.claim_weekly_quest(p_key text)
returns int language plpgsql security definer set search_path = '' as $$
declare r record; uid uuid := auth.uid();
begin
  if uid is null then return 0; end if;
  select * into r from public.weekly_quest_progress() w where w.quest_key = p_key;
  if not found or r.claimed or r.progress < r.target then return 0; end if;
  insert into public.weekly_quest_claims(user_id, week_start, quest_key, points)
  values (uid, public.quest_week_start(), p_key, r.points)
  on conflict do nothing;
  return r.points;
end; $$;

revoke execute on function public.weekly_quest_progress() from public, anon;
revoke execute on function public.claim_weekly_quest(text) from public, anon;
grant execute on function public.weekly_quest_progress() to authenticated;
grant execute on function public.claim_weekly_quest(text) to authenticated;
grant execute on function public.quest_week_start() to authenticated;
