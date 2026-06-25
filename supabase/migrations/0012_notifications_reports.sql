-- Uygulama içi bildirimler + içerik şikayetleri

-- Bildirimler
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,            -- 'comment' | 'like' | 'note'
  message text not null,
  link text,                     -- ilgili sayfa (ör. /notes/<id>)
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;
create policy "notifications_select_own" on notifications
  for select using (auth.uid() = user_id);
create policy "notifications_update_own" on notifications
  for update using (auth.uid() = user_id);
-- Bildirim oluşturma sunucu (service_role) üzerinden yapılır

create index idx_notifications_user on notifications(user_id, read);

-- Şikayetler
create table reports (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references notes(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table reports enable row level security;
create policy "reports_insert_auth" on reports
  for insert with check (auth.uid() is not null);
-- Okuma yalnızca moderasyon (service_role) için; normal kullanıcı göremez

-- Yorum yapılınca not sahibine bildirim
create or replace function public.notify_on_comment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare owner uuid; ntitle text;
begin
  select user_id, title into owner, ntitle from public.notes where id = new.note_id;
  if owner is not null and owner <> new.user_id then
    insert into public.notifications(user_id, type, message, link)
    values (owner, 'comment', '"' || ntitle || '" notuna yeni bir yorum yapıldı.',
            '/notes/' || new.note_id);
  end if;
  return null;
end; $$;
drop trigger if exists on_comment_notify on comments;
create trigger on_comment_notify after insert on comments
  for each row execute function public.notify_on_comment();

-- Beğeni gelince not sahibine bildirim
create or replace function public.notify_on_like()
returns trigger language plpgsql security definer set search_path = '' as $$
declare owner uuid; ntitle text;
begin
  select user_id, title into owner, ntitle from public.notes where id = new.note_id;
  if owner is not null and owner <> new.user_id then
    insert into public.notifications(user_id, type, message, link)
    values (owner, 'like', '"' || ntitle || '" notun beğenildi.',
            '/notes/' || new.note_id);
  end if;
  return null;
end; $$;
drop trigger if exists on_like_notify on likes;
create trigger on_like_notify after insert on likes
  for each row execute function public.notify_on_like();

-- Takip edilen derse yeni not eklenince abonelere bildirim
create or replace function public.notify_on_note()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.course_id is not null then
    insert into public.notifications(user_id, type, message, link)
    select cs.user_id, 'note',
           'Takip ettiğin derse yeni not eklendi: ' || new.title,
           '/notes/' || new.id
    from public.course_subscriptions cs
    where cs.course_id = new.course_id and cs.user_id <> new.user_id;
  end if;
  return null;
end; $$;
drop trigger if exists on_note_notify on notes;
create trigger on_note_notify after insert on notes
  for each row execute function public.notify_on_note();
