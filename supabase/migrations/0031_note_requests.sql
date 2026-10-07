-- Not isteği: "Bu dersin 2024 finali lazım" → biri yükleyince isteyen(ler)e haber gider.
create table if not exists public.note_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 150),
  detail text check (detail is null or char_length(detail) <= 500),
  status text not null default 'open' check (status in ('open','fulfilled','closed')),
  fulfilled_note_id uuid references public.notes(id) on delete set null,
  fulfilled_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  fulfilled_at timestamptz
);
create index if not exists note_requests_course_idx on public.note_requests (course_id, status, created_at desc);
create index if not exists note_requests_status_idx on public.note_requests (status, created_at desc);

create table if not exists public.note_request_votes (
  request_id uuid not null references public.note_requests(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);

alter table public.note_requests enable row level security;
alter table public.note_request_votes enable row level security;

drop policy if exists nr_select on public.note_requests;
create policy nr_select on public.note_requests for select using (true);
drop policy if exists nr_insert_own on public.note_requests;
create policy nr_insert_own on public.note_requests for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'open' and fulfilled_note_id is null and fulfilled_by is null);
-- Sahibi yalnızca kapatabilir/silebilir (karşılama RPC ile)
drop policy if exists nr_update_own on public.note_requests;
create policy nr_update_own on public.note_requests for update to authenticated
  using ((select auth.uid()) = user_id) with check (status in ('open','closed') and fulfilled_note_id is null);
drop policy if exists nr_delete_own on public.note_requests;
create policy nr_delete_own on public.note_requests for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists nrv_select on public.note_request_votes;
create policy nrv_select on public.note_request_votes for select using (true);
drop policy if exists nrv_insert_own on public.note_request_votes;
create policy nrv_insert_own on public.note_request_votes for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists nrv_delete_own on public.note_request_votes;
create policy nrv_delete_own on public.note_request_votes for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.note_requests, public.note_request_votes from anon, authenticated;
grant select on public.note_requests, public.note_request_votes to anon;
grant select, insert, delete on public.note_request_votes to authenticated;
grant select, insert, delete on public.note_requests to authenticated;
grant update (status) on public.note_requests to authenticated;

-- Bir isteği kendi yüklediğin notla karşıla (not aynı derste ve senin olmalı)
create or replace function public.fulfill_note_request(p_request uuid, p_note uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare r public.note_requests; n public.notes; uname text;
begin
  select * into r from public.note_requests where id = p_request for update;
  select * into n from public.notes where id = p_note;
  if r.id is null or n.id is null or r.status <> 'open' then return false; end if;
  if n.user_id <> auth.uid() or n.course_id <> r.course_id or r.user_id = auth.uid() then return false; end if;

  update public.note_requests
     set status = 'fulfilled', fulfilled_note_id = n.id, fulfilled_by = n.user_id, fulfilled_at = now()
   where id = r.id;

  select name into uname from public.users where id = n.user_id;
  insert into public.notifications(user_id, type, message, link)
  select x.uid, 'request', coalesce(uname, 'Biri') || ' istediğin notu yükledi: ' || r.title, '/notes/' || n.id
  from (select r.user_id as uid union select v.user_id from public.note_request_votes v where v.request_id = r.id) x
  where x.uid <> n.user_id;
  return true;
end; $$;
revoke execute on function public.fulfill_note_request(uuid, uuid) from public, anon;
grant execute on function public.fulfill_note_request(uuid, uuid) to authenticated;
