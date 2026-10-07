-- Kullanım Şartları + 18 yaş beyanının kabul zamanı (profil tamamlamada zorunlu onay).
alter table public.users add column if not exists terms_accepted_at timestamptz;

grant select (terms_accepted_at) on public.users to authenticated;
grant update (terms_accepted_at) on public.users to authenticated;

-- İstemci tarih uyduramasın: ilk kabulde sunucu saati yazılır, sonradan değiştirilemez/silinemez.
create or replace function public.users_terms_accepted_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.terms_accepted_at is not null then
    new.terms_accepted_at := old.terms_accepted_at;
  elsif new.terms_accepted_at is not null then
    new.terms_accepted_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists users_terms_accepted_guard on public.users;
create trigger users_terms_accepted_guard
  before update of terms_accepted_at on public.users
  for each row execute function public.users_terms_accepted_guard();

revoke execute on function public.users_terms_accepted_guard() from public, anon, authenticated;
