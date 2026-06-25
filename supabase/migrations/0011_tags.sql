-- Etiketler: öğrenciler not yüklerken etiket ekleyebilsin
-- (tags ve note_tags tabloları 0001'de, select RLS'leri 0002'de mevcut)

drop policy if exists "tags_insert_auth" on tags;
create policy "tags_insert_auth" on tags
  for insert with check (auth.uid() is not null);

drop policy if exists "note_tags_insert_auth" on note_tags;
create policy "note_tags_insert_auth" on note_tags
  for insert with check (auth.uid() is not null);

drop policy if exists "note_tags_delete_auth" on note_tags;
create policy "note_tags_delete_auth" on note_tags
  for delete using (auth.uid() is not null);

-- Etiket adında benzersizlik (idempotent ekleme için)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tags_name_key') then
    alter table tags add constraint tags_name_key unique (name);
  end if;
end $$;
