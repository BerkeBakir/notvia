-- =====================================================================
-- Notvia — 0009-0014 IDEMPOTENT birleşik migration
-- Tekrar tekrar çalıştırılabilir; mevcut olanı atlar, eksikleri tamamlar.
-- Supabase SQL Editor'de tek seferde çalıştır.
-- =====================================================================

-- ============ 0009 — note_summaries ============
create table if not exists note_summaries (
  note_id uuid primary key references notes(id) on delete cascade,
  summary text not null,
  created_at timestamptz not null default now()
);
alter table note_summaries enable row level security;
drop policy if exists "note_summaries_select_all" on note_summaries;
create policy "note_summaries_select_all" on note_summaries for select using (true);

-- ============ 0010 — dislike + puan ============
alter table notes add column if not exists dislikes integer not null default 0;

create table if not exists dislikes (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references notes(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  unique (note_id, user_id)
);
alter table dislikes enable row level security;
drop policy if exists "dislikes_select_all" on dislikes;
create policy "dislikes_select_all" on dislikes for select using (true);
drop policy if exists "dislikes_insert_own" on dislikes;
create policy "dislikes_insert_own" on dislikes for insert with check (auth.uid() = user_id);
drop policy if exists "dislikes_delete_own" on dislikes;
create policy "dislikes_delete_own" on dislikes for delete using (auth.uid() = user_id);
create index if not exists idx_dislikes_note_id on dislikes(note_id);

create or replace function public.sync_note_dislikes()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (tg_op = 'INSERT') then
    update public.notes set dislikes = dislikes + 1 where id = new.note_id;
  elsif (tg_op = 'DELETE') then
    update public.notes set dislikes = greatest(dislikes - 1, 0) where id = old.note_id;
  end if;
  return null;
end; $$;
drop trigger if exists on_dislike_change on dislikes;
create trigger on_dislike_change after insert or delete on dislikes
  for each row execute function public.sync_note_dislikes();

-- ============ 0011 — etiket izinleri ============
drop policy if exists "tags_insert_auth" on tags;
create policy "tags_insert_auth" on tags for insert with check (auth.uid() is not null);
drop policy if exists "note_tags_insert_auth" on note_tags;
create policy "note_tags_insert_auth" on note_tags for insert with check (auth.uid() is not null);
drop policy if exists "note_tags_delete_auth" on note_tags;
create policy "note_tags_delete_auth" on note_tags for delete using (auth.uid() is not null);
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tags_name_key') then
    alter table tags add constraint tags_name_key unique (name);
  end if;
end $$;

-- ============ 0012 — bildirimler + şikayetler ============
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  message text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table notifications enable row level security;
drop policy if exists "notifications_select_own" on notifications;
create policy "notifications_select_own" on notifications for select using (auth.uid() = user_id);
drop policy if exists "notifications_update_own" on notifications;
create policy "notifications_update_own" on notifications for update using (auth.uid() = user_id);
create index if not exists idx_notifications_user on notifications(user_id, read);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references notes(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  reason text not null,
  created_at timestamptz not null default now()
);
alter table reports enable row level security;
drop policy if exists "reports_insert_auth" on reports;
create policy "reports_insert_auth" on reports for insert with check (auth.uid() is not null);

create or replace function public.notify_on_comment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare owner uuid; ntitle text;
begin
  select user_id, title into owner, ntitle from public.notes where id = new.note_id;
  if owner is not null and owner <> new.user_id then
    insert into public.notifications(user_id, type, message, link)
    values (owner, 'comment', '"' || ntitle || '" notuna yeni bir yorum yapıldı.', '/notes/' || new.note_id);
  end if;
  return null;
end; $$;
drop trigger if exists on_comment_notify on comments;
create trigger on_comment_notify after insert on comments
  for each row execute function public.notify_on_comment();

create or replace function public.notify_on_like()
returns trigger language plpgsql security definer set search_path = '' as $$
declare owner uuid; ntitle text;
begin
  select user_id, title into owner, ntitle from public.notes where id = new.note_id;
  if owner is not null and owner <> new.user_id then
    insert into public.notifications(user_id, type, message, link)
    values (owner, 'like', '"' || ntitle || '" notun beğenildi.', '/notes/' || new.note_id);
  end if;
  return null;
end; $$;
drop trigger if exists on_like_notify on likes;
create trigger on_like_notify after insert on likes
  for each row execute function public.notify_on_like();

create or replace function public.notify_on_note()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.course_id is not null then
    insert into public.notifications(user_id, type, message, link)
    select cs.user_id, 'note', 'Takip ettiğin derse yeni not eklendi: ' || new.title, '/notes/' || new.id
    from public.course_subscriptions cs
    where cs.course_id = new.course_id and cs.user_id <> new.user_id;
  end if;
  return null;
end; $$;
drop trigger if exists on_note_notify on notes;
create trigger on_note_notify after insert on notes
  for each row execute function public.notify_on_note();

-- ============ 0013 — ders doğrulama ============
create table if not exists course_verifications (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (course_id, user_id)
);
alter table course_verifications enable row level security;
drop policy if exists "course_verif_select_all" on course_verifications;
create policy "course_verif_select_all" on course_verifications for select using (true);
drop policy if exists "course_verif_insert_own" on course_verifications;
create policy "course_verif_insert_own" on course_verifications for insert with check (auth.uid() = user_id);
drop policy if exists "course_verif_delete_own" on course_verifications;
create policy "course_verif_delete_own" on course_verifications for delete using (auth.uid() = user_id);
create index if not exists idx_course_verif_course on course_verifications(course_id);

create or replace function public.check_course_verification()
returns trigger language plpgsql security definer set search_path = '' as $$
declare cnt integer; cid uuid;
begin
  cid := coalesce(new.course_id, old.course_id);
  select count(*) into cnt from public.course_verifications where course_id = cid;
  update public.courses set verified = (cnt >= 3) where id = cid;
  return null;
end; $$;
drop trigger if exists on_course_verification on course_verifications;
create trigger on_course_verification after insert or delete on course_verifications
  for each row execute function public.check_course_verification();

-- ============ 0014 — davet/referans ============
create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references users(id) on delete cascade,
  referred_id uuid not null references users(id) on delete cascade unique,
  created_at timestamptz not null default now(),
  check (referrer_id <> referred_id)
);
alter table referrals enable row level security;
drop policy if exists "referrals_select_all" on referrals;
create policy "referrals_select_all" on referrals for select using (true);
drop policy if exists "referrals_insert_self" on referrals;
create policy "referrals_insert_self" on referrals for insert with check (auth.uid() = referred_id);
create index if not exists idx_referrals_referrer on referrals(referrer_id);
