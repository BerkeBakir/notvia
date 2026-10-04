-- Referral ödülü: 5 davet → 1 ay Premium (süreli)
alter table users add column if not exists premium_until timestamptz;
alter table users add column if not exists referral_reward_granted boolean not null default false;
grant select (premium_until) on public.users to authenticated;
