-- Otomatik şikayet akışı: 3 farklı kullanıcı şikayet edince not gizlenir ve moderatör onayını bekler.

alter table public.notes add column if not exists hidden_at timestamptz;
create index if not exists notes_hidden_idx on public.notes (hidden_at) where hidden_at is not null;

-- Gizli notları yalnızca sahibi görür (moderatör service_role ile okur).
alter policy "notes_select_all" on public.notes using (hidden_at is null or auth.uid() = user_id);

-- Sahibi kendi notunun gizliliğini değiştiremesin (notes_update_own tüm sütunlara izin veriyor).
create or replace function public.notes_hidden_guard() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if new.hidden_at is distinct from old.hidden_at and coalesce(auth.role(), '') <> 'service_role'
     and current_user not in ('postgres', 'supabase_admin') then
    new.hidden_at := old.hidden_at;
  end if;
  return new;
end; $$;
drop trigger if exists notes_hidden_guard on public.notes;
create trigger notes_hidden_guard before update on public.notes
  for each row execute function public.notes_hidden_guard();

-- Şikayet başkası adına atılamasın; aynı kişi aynı notu bir kez şikayet edebilsin.
alter policy "reports_insert_auth" on public.reports with check (auth.uid() = user_id);
delete from public.reports a using public.reports b
  where a.note_id = b.note_id and a.user_id = b.user_id and a.created_at > b.created_at;
create unique index if not exists reports_note_user_uniq on public.reports (note_id, user_id);

-- 3. farklı şikayetçide notu gizle + sahibine bildir.
create or replace function public.auto_hide_reported_note() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare n_reporters int; owner uuid; ntitle text; hid timestamptz;
begin
  select user_id, title, hidden_at into owner, ntitle, hid from public.notes where id = new.note_id;
  if hid is not null or owner is null then return null; end if;
  select count(distinct user_id) into n_reporters from public.reports
    where note_id = new.note_id and user_id is not null and user_id <> owner;
  if n_reporters >= 3 then
    update public.notes set hidden_at = now() where id = new.note_id;
    insert into public.notifications(user_id, type, message, link)
    values (owner, 'note_hidden',
            '"' || ntitle || '" notun birden fazla şikayet aldığı için incelemeye alındı; inceleme bitene kadar yalnızca sen görebilirsin.',
            '/notes/' || new.note_id);
  end if;
  return null;
end; $$;
revoke execute on function public.auto_hide_reported_note() from public, anon, authenticated;
drop trigger if exists on_report_auto_hide on public.reports;
create trigger on_report_auto_hide after insert on public.reports
  for each row execute function public.auto_hide_reported_note();

-- AI araması service_role ile çalışır (RLS'yi atlar): gizli notların parçalarını açıkça dışla.
create or replace function public.match_note_chunks_v2(query_embedding vector, match_count integer default 12,
  filter_course_id uuid default null, filter_note_ids uuid[] default null)
returns table(note_id uuid, course_id uuid, content text, similarity double precision)
language sql stable set search_path to 'public', 'pg_temp' as $function$
  select nc.note_id, nc.course_id, nc.content, 1 - (nc.embedding <=> query_embedding) as similarity
  from note_chunks nc
  where (filter_course_id is null or nc.course_id = filter_course_id)
    and (filter_note_ids is null or nc.note_id = any(filter_note_ids))
    and not exists (select 1 from notes n where n.id = nc.note_id and n.hidden_at is not null)
  order by nc.embedding <=> query_embedding limit match_count; $function$;
