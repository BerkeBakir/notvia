-- Davet/referans sistemi: bir kullanıcı arkadaşını davet eder

create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references users(id) on delete cascade,
  referred_id uuid not null references users(id) on delete cascade unique,
  created_at timestamptz not null default now(),
  check (referrer_id <> referred_id)
);

alter table referrals enable row level security;
create policy "referrals_select_all" on referrals for select using (true);
create policy "referrals_insert_self" on referrals
  for insert with check (auth.uid() = referred_id);

create index idx_referrals_referrer on referrals(referrer_id);
