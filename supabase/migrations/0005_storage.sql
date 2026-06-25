-- 'notes' adlı public storage bucket (PDF dosyaları için)
insert into storage.buckets (id, name, public)
values ('notes', 'notes', true)
on conflict (id) do nothing;

-- Herkes okuyabilir (public bucket)
create policy "notes_storage_public_read"
  on storage.objects for select
  using (bucket_id = 'notes');

-- Sadece giriş yapmış kullanıcılar yükleyebilir
create policy "notes_storage_auth_insert"
  on storage.objects for insert
  with check (bucket_id = 'notes' and auth.uid() is not null);

-- Kullanıcı yalnızca kendi yüklediği dosyayı silebilir
create policy "notes_storage_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'notes' and owner = auth.uid());
