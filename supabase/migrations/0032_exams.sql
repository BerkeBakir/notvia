-- Sınav takvimi: kişisel sınav tarihleri, geri sayım ve e-posta hatırlatması (3 gün + 1 gün önce).
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  title text not null check (char_length(title) between 2 and 120),
  kind text not null default 'vize' check (kind in ('vize','final','quiz','butunleme','odev','diger')),
  exam_at timestamptz not null,
  location text check (location is null or char_length(location) <= 100),
  remind boolean not null default true,
  reminded_3d boolean not null default false,
  reminded_1d boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists exams_user_idx on public.exams (user_id, exam_at);
create index if not exists exams_remind_idx on public.exams (exam_at) where remind;

alter table public.exams enable row level security;
drop policy if exists exams_own on public.exams;
create policy exams_own on public.exams for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.exams from anon, authenticated;
grant select, insert, delete on public.exams to authenticated;
-- hatırlatma bayraklarını yalnızca sunucu (cron) değiştirir → kullanıcı sadece bu sütunları güncelleyebilir
grant update (course_id, title, kind, exam_at, location, remind) on public.exams to authenticated;
