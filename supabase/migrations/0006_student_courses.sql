-- Öğrenci katkılı üniversite/bölüm/ders + doğrulama altyapısı

-- Kim ekledi bilgisi
alter table universities add column if not exists created_by uuid references users(id) on delete set null;
alter table departments add column if not exists created_by uuid references users(id) on delete set null;
alter table courses add column if not exists created_by uuid references users(id) on delete set null;

-- Doğrulama durumu (şimdilik dersler hemen görünür; ileride kullanılacak)
alter table courses add column if not exists verified boolean not null default false;

-- Mevcut örnek dersler doğrulanmış sayılsın
update courses set verified = true where verified = false;

-- Tekrarı önlemek için benzersizlik kısıtları (idempotent seed için)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'universities_name_key') then
    alter table universities add constraint universities_name_key unique (name);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'departments_uni_name_key') then
    alter table departments add constraint departments_uni_name_key unique (university_id, name);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'courses_dep_name_key') then
    alter table courses add constraint courses_dep_name_key unique (department_id, name);
  end if;
end $$;

-- Giriş yapmış kullanıcılar üniversite, bölüm ve ders ekleyebilsin
drop policy if exists "universities_insert_auth" on universities;
create policy "universities_insert_auth" on universities
  for insert with check (auth.uid() is not null);

drop policy if exists "departments_insert_auth" on departments;
create policy "departments_insert_auth" on departments
  for insert with check (auth.uid() is not null);

drop policy if exists "courses_insert_auth" on courses;
create policy "courses_insert_auth" on courses
  for insert with check (auth.uid() is not null);
