-- Türkçe dostu not araması: harf katlama (ğ→g, ü→u, ı/İ→i …), kelime sonu ek toleransı
-- (güvenlik ~ güvenliği), başlık + açıklama + ders adında arar; tüm kelimeler eşleşmeli.
create or replace function public.tr_fold(t text)
returns text language sql immutable parallel safe set search_path = '' as $$
  select lower(translate(coalesce(t, ''), 'ÇĞİIÖŞÜÂÎÛçğıöşüâîû', 'cgiiosuaiucgiosuaiu'));
$$;

create or replace function public.search_note_ids(q text, dep uuid default null, lim int default 30)
returns table (id uuid) language plpgsql stable set search_path = '' as $$
declare words text[];
begin
  select array_agg(replace(replace(x, '%', ''), '_', '')) into words
  from unnest(regexp_split_to_array(public.tr_fold(trim(q)), '\s+')) x
  where length(x) >= 2 or x ~ '^[0-9]+$';
  if words is null then return; end if;
  return query
  select n.id from public.notes n
  left join public.courses c on c.id = n.course_id
  where (dep is null or c.department_id = dep)
    and (select bool_and(
           hay like '%' || ww || '%'
           -- ünsüz yumuşaması: güvenlik → güvenliği, kitap → kitabı, ağaç → ağacı
           or (length(ww) >= 4 and right(ww, 1) in ('k','p','t')
               and hay like '%' || left(ww, length(ww) - 1)
                 || case right(ww, 1) when 'k' then 'g' when 'p' then 'b' else 'd' end || '%'))
         from unnest(words) ww,
              lateral (select public.tr_fold(n.title || ' ' || coalesce(n.description, '') || ' ' || coalesce(c.name, '')) as hay) h)
  order by n.likes desc, n.created_at desc
  limit least(greatest(lim, 1), 100);
end; $$;

grant execute on function public.tr_fold(text) to anon, authenticated;
grant execute on function public.search_note_ids(text, uuid, int) to anon, authenticated;
