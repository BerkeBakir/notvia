-- Kısa davet kodu (kullanıcı id'sinin ilk 8 hex hanesi): link cihaz değiştirince kaybolduğu için
-- kayıt formunda / profil tamamlamada elle de girilebilsin.
create or replace function public.referral_code(uid uuid)
returns text language sql immutable set search_path = '' as $$
  select upper(left(replace(uid::text, '-', ''), 8));
$$;

create or replace function public.referrer_by_code(code text)
returns uuid language sql stable security definer set search_path = '' as $$
  select u.id from public.users u
  where public.referral_code(u.id) = upper(regexp_replace(coalesce(code, ''), '[^0-9A-Fa-f]', '', 'g'))
  limit 1;
$$;

-- E-posta kaydında kod user_metadata.ref_code ile gelir → kayıt anında bağla
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = 'public', 'pg_temp' as $$
declare ref uuid;
begin
  insert into public.users (id, email, name, avatar_url) values (new.id, new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url') on conflict (id) do nothing;

  if coalesce(new.raw_user_meta_data ->> 'ref_code', '') <> '' then
    ref := public.referrer_by_code(new.raw_user_meta_data ->> 'ref_code');
    if ref is not null and ref <> new.id then
      insert into public.referrals (referrer_id, referred_id) values (ref, new.id) on conflict do nothing;
    end if;
  end if;
  return new;
end; $$;

-- Google ile kaydolanlar için: profil tamamlamada kod girilir (yalnızca yeni hesap, tek sefer)
create or replace function public.apply_referral_code(code text)
returns text language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); ref uuid; created timestamptz;
begin
  if me is null then return 'auth'; end if;
  if exists (select 1 from public.referrals where referred_id = me) then return 'already'; end if;
  select created_at into created from public.users where id = me;
  if created < now() - interval '1 day' then return 'too_old'; end if;
  ref := public.referrer_by_code(code);
  if ref is null then return 'not_found'; end if;
  if ref = me then return 'self'; end if;
  insert into public.referrals (referrer_id, referred_id) values (ref, me) on conflict do nothing;
  return 'ok';
end; $$;

revoke execute on function public.referrer_by_code(text) from public, anon, authenticated;
revoke execute on function public.apply_referral_code(text) from public, anon;
grant execute on function public.apply_referral_code(text) to authenticated;
grant execute on function public.referral_code(uuid) to anon, authenticated;
