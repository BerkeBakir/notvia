-- Atomik günlük AI kota sayacı (yarış-durumu önler)
create table ai_daily_usage (
  user_id uuid not null references users(id) on delete cascade,
  day date not null,
  count int not null default 0,
  primary key (user_id, day)
);

alter table ai_daily_usage enable row level security;
create policy "ai_usage_select_own" on ai_daily_usage
  for select using (auth.uid() = user_id);

-- Tek atomik ifadeyle: limit aşılmadıysa say ve kalan hakkı döndür; aşıldıysa -1
create or replace function consume_ai_quota(p_user uuid, p_limit int)
returns int
language plpgsql
as $$
declare new_count int;
begin
  insert into ai_daily_usage(user_id, day, count)
  values (p_user, current_date, 1)
  on conflict (user_id, day)
  do update set count = ai_daily_usage.count + 1
    where ai_daily_usage.count < p_limit
  returning count into new_count;

  if new_count is null then
    return -1; -- limit dolu
  end if;
  return p_limit - new_count; -- kalan hak
end; $$;

-- Başarısız istekte iade (best-effort)
create or replace function refund_ai_quota(p_user uuid)
returns void
language sql
as $$
  update ai_daily_usage set count = greatest(0, count - 1)
  where user_id = p_user and day = current_date;
$$;
