-- Davet kötüye kullanımı: mevcut (eski) hesaplar davet linkine tıklayarak "davet edilmiş" sayılmasın.
-- Yalnızca son 24 saatte açılmış hesaplar bir davete bağlanabilir.
drop policy if exists "referrals_insert_self" on public.referrals;
create policy "referrals_insert_self" on public.referrals for insert to authenticated
  with check (
    (select auth.uid()) = referred_id
    and exists (select 1 from public.users u where u.id = referred_id and u.created_at > now() - interval '1 day')
  );
