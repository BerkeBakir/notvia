-- Yüklemede kalite kontrolü: aynı dosyanın aynı derse tekrar yüklenmesini yakalamak için içerik özeti.
alter table public.notes add column if not exists file_hash text check (file_hash is null or file_hash ~ '^[0-9a-f]{64}$');
create index if not exists notes_course_hash_idx on public.notes (course_id, file_hash) where file_hash is not null;
