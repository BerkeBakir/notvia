-- 1) Kullanıcı kendi notunu beğenemez / beğenmeyemez (RLS seviyesinde)
drop policy if exists "likes_insert_own" on likes;
create policy "likes_insert_own" on likes for insert with check (
  auth.uid() = user_id
  and not exists (select 1 from notes n where n.id = note_id and n.user_id = auth.uid())
);

drop policy if exists "dislikes_insert_own" on dislikes;
create policy "dislikes_insert_own" on dislikes for insert with check (
  auth.uid() = user_id
  and not exists (select 1 from notes n where n.id = note_id and n.user_id = auth.uid())
);

-- Mevcut kendi-oylarını temizle (sayaç tetikleyicileri notes.likes/dislikes'ı düşürür)
delete from likes l using notes n where n.id = l.note_id and n.user_id = l.user_id;
delete from dislikes d using notes n where n.id = d.note_id and n.user_id = d.user_id;
