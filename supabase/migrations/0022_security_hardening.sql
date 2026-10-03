-- Güvenlik sıkılaştırması (denetim sonrası)

-- 1) users.email'i anon/authenticated istemcilerden gizle (PII). Yalnızca service_role okur.
revoke select on public.users from anon, authenticated;
grant select (id, name, avatar_url, university_id, department_id, plan, role, created_at, class_year)
  on public.users to anon, authenticated;

-- 2) Kullanıcı kendi satırında plan/role değiştiremesin (yetki yükseltme önlemi).
--    plan/role yalnızca service_role (Stripe webhook / admin) ile değişir.
revoke update on public.users from anon, authenticated;
grant update (name, avatar_url, university_id, department_id, class_year)
  on public.users to authenticated;

-- 3) Depolama: kullanıcı yalnızca kendi klasörüne (userId/...) yükleyebilsin.
drop policy if exists "notes_storage_auth_insert" on storage.objects;
create policy "notes_storage_auth_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'notes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
