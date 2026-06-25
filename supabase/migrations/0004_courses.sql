-- Hiyerarşi: üniversite → bölüm → ders → not
-- + ders bazlı bildirim abonelikleri

-- Dersler (bir bölüme ait)
create table courses (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  name text not null,
  instructor text,
  created_at timestamptz not null default now()
);

-- Notlar artık bir derse bağlanabilir
alter table notes
  add column course_id uuid references courses(id) on delete set null;

-- Ders bildirim abonelikleri ("bu ders için bildirimleri aç")
create table course_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create index idx_courses_department_id on courses(department_id);
create index idx_notes_course_id on notes(course_id);
create index idx_course_subs_course_id on course_subscriptions(course_id);
create index idx_course_subs_user_id on course_subscriptions(user_id);

-- RLS
alter table courses enable row level security;
alter table course_subscriptions enable row level security;

create policy "courses_select_all" on courses for select using (true);

create policy "course_subs_select_own" on course_subscriptions
  for select using (auth.uid() = user_id);
create policy "course_subs_insert_own" on course_subscriptions
  for insert with check (auth.uid() = user_id);
create policy "course_subs_delete_own" on course_subscriptions
  for delete using (auth.uid() = user_id);
