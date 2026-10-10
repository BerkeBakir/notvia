-- notes_update_own politikası tüm sütunlara izin veriyordu: sahibi kendi notunun beğeni/indirme
-- sayılarını şişirebilir, kalite sıralamasını (quality_score) manipüle edebilirdi.
-- Sayaçlar yalnızca tetikleyiciler / güvenli RPC'ler (postgres) veya service_role ile değişir.
create or replace function public.notes_hidden_guard() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and current_user not in ('postgres', 'supabase_admin') then
    new.hidden_at := old.hidden_at;
    new.likes := old.likes;
    new.dislikes := old.dislikes;
    new.downloads := old.downloads;
    new.file_hash := old.file_hash;
  end if;
  return new;
end; $$;
