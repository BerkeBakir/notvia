-- Arkadaş sistemi (takip): takip, bildirimler, davetle otomatik arkadaşlık.
create table if not exists public.follows (
  follower_id uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists follows_following_idx on public.follows (following_id);

alter table public.follows enable row level security;
drop policy if exists follows_select_auth on public.follows;
create policy follows_select_auth on public.follows for select to authenticated using (true);
drop policy if exists follows_insert_own on public.follows;
create policy follows_insert_own on public.follows for insert to authenticated
  with check ((select auth.uid()) = follower_id);
drop policy if exists follows_delete_own on public.follows;
create policy follows_delete_own on public.follows for delete to authenticated
  using ((select auth.uid()) = follower_id);
revoke all on public.follows from anon;
grant select, insert, delete on public.follows to authenticated;

-- Takip edilince bildirim
create or replace function public.notify_on_follow()
returns trigger language plpgsql security definer set search_path = '' as $$
declare fname text;
begin
  select name into fname from public.users where id = new.follower_id;
  insert into public.notifications(user_id, type, message, link)
  values (new.following_id, 'follow', coalesce(fname, 'Bir öğrenci') || ' seni arkadaş olarak ekledi.',
          '/users/' || new.follower_id);
  return null;
end; $$;
drop trigger if exists on_follow_notify on public.follows;
create trigger on_follow_notify after insert on public.follows
  for each row execute function public.notify_on_follow();

-- Arkadaşın not paylaşınca bildirim (o dersin abonelerine zaten gidiyor → tekrar etme)
create or replace function public.notify_followers_on_note()
returns trigger language plpgsql security definer set search_path = '' as $$
declare uname text;
begin
  select name into uname from public.users where id = new.user_id;
  insert into public.notifications(user_id, type, message, link)
  select f.follower_id, 'friend_note',
         coalesce(uname, 'Arkadaşın') || ' yeni not paylaştı: ' || new.title,
         '/notes/' || new.id
  from public.follows f
  where f.following_id = new.user_id
    and not exists (
      select 1 from public.course_subscriptions cs
      where cs.course_id = new.course_id and cs.user_id = f.follower_id
    );
  return null;
end; $$;
drop trigger if exists on_note_notify_followers on public.notes;
create trigger on_note_notify_followers after insert on public.notes
  for each row execute function public.notify_followers_on_note();

-- Davet kabul edilince iki taraf otomatik arkadaş olur
create or replace function public.befriend_on_referral()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.follows(follower_id, following_id)
  values (new.referrer_id, new.referred_id), (new.referred_id, new.referrer_id)
  on conflict do nothing;
  return null;
end; $$;
drop trigger if exists on_referral_befriend on public.referrals;
create trigger on_referral_befriend after insert on public.referrals
  for each row execute function public.befriend_on_referral();

revoke execute on function public.notify_on_follow() from public, anon, authenticated;
revoke execute on function public.notify_followers_on_note() from public, anon, authenticated;
revoke execute on function public.befriend_on_referral() from public, anon, authenticated;

-- Mevcut davetler için geriye dönük arkadaşlık
insert into public.follows(follower_id, following_id)
select referrer_id, referred_id from public.referrals
union
select referred_id, referrer_id from public.referrals
on conflict do nothing;
