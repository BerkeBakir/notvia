-- Profil için sınıf bilgisi + indirme sayacı RPC'si
-- (university_id ve department_id users tablosunda zaten var)

alter table users add column if not exists class_year text;

-- Herhangi bir kullanıcı indirince sayacı güvenli şekilde artır (RLS bypass)
create or replace function public.increment_download(note_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.notes set downloads = downloads + 1 where id = note_id;
end;
$$;

grant execute on function public.increment_download(uuid) to anon, authenticated;
