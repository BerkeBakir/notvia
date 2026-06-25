-- Ders doğrulama: topluluk oyu (3 farklı öğrenci onaylayınca ders 'verified' olur)

create table course_verifications (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (course_id, user_id)
);

alter table course_verifications enable row level security;
create policy "course_verif_select_all" on course_verifications
  for select using (true);
create policy "course_verif_insert_own" on course_verifications
  for insert with check (auth.uid() = user_id);
create policy "course_verif_delete_own" on course_verifications
  for delete using (auth.uid() = user_id);

create index idx_course_verif_course on course_verifications(course_id);

-- Eşik (3) dolunca dersi doğrulanmış işaretle
create or replace function public.check_course_verification()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  cnt integer;
  cid uuid;
begin
  cid := coalesce(new.course_id, old.course_id);
  select count(*) into cnt from public.course_verifications where course_id = cid;
  update public.courses set verified = (cnt >= 3) where id = cid;
  return null;
end;
$$;

drop trigger if exists on_course_verification on course_verifications;
create trigger on_course_verification
  after insert or delete on course_verifications
  for each row execute function public.check_course_verification();
