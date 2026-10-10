-- Ödeme altyapısı (iyzico abonelik) + "Premium alır mıydın?" ilgi anketi.

-- Abonelikler: ödeme formu başlatılınca 'pending' satır açılır (token ile),
-- geri dönüşte/webhook'ta iyzico'dan doğrulanan durumla güncellenir.
create table if not exists public.payment_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null default 'iyzico',
  plan text not null check (plan in ('premium','pro')),
  billing text not null check (billing in ('monthly','yearly')),
  checkout_token text unique,
  reference_code text unique,
  status text not null default 'INITIATED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payment_subscriptions_user_idx on public.payment_subscriptions (user_id, created_at desc);
alter table public.payment_subscriptions enable row level security;
revoke all on public.payment_subscriptions from anon, authenticated;
-- Kullanıcı kendi aboneliğini görebilir (ayarlar sayfası); yazma yalnızca service_role.
grant select on public.payment_subscriptions to authenticated;
drop policy if exists "payment_subscriptions_own_select" on public.payment_subscriptions;
create policy "payment_subscriptions_own_select" on public.payment_subscriptions
  for select to authenticated using (user_id = auth.uid());

-- İlgi anketi: kullanıcı başına tek cevap (güncellenebilir).
create table if not exists public.premium_interest (
  user_id uuid primary key references public.users(id) on delete cascade,
  answer text not null check (answer in ('evet','belki','hayir')),
  plan text check (plan in ('premium','pro')),
  max_price text check (max_price in ('0-25','25-50','50-100','100+')),
  wants text check (wants is null or char_length(wants) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.premium_interest enable row level security;
revoke all on public.premium_interest from anon, authenticated;
grant select, insert, update on public.premium_interest to authenticated;
drop policy if exists "premium_interest_own" on public.premium_interest;
create policy "premium_interest_own" on public.premium_interest
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
