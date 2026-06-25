-- 'pro' planı + beğeni sayacı senkronizasyonu

-- users.plan: free / premium / pro
alter table users drop constraint if exists users_plan_check;
alter table users add constraint users_plan_check
  check (plan in ('free', 'premium', 'pro'));

-- subscriptions sadece ücretli planları tutar
alter table subscriptions drop constraint if exists subscriptions_plan_check;
alter table subscriptions add constraint subscriptions_plan_check
  check (plan in ('premium', 'pro'));

-- Beğeni eklenince/silinince notes.likes sayacını güncelle
create or replace function public.sync_note_likes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (tg_op = 'INSERT') then
    update public.notes set likes = likes + 1 where id = new.note_id;
  elsif (tg_op = 'DELETE') then
    update public.notes set likes = greatest(likes - 1, 0) where id = old.note_id;
  end if;
  return null;
end;
$$;

drop trigger if exists on_like_change on likes;
create trigger on_like_change
  after insert or delete on likes
  for each row execute function public.sync_note_likes();
