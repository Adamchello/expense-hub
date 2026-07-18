-- =========================
-- Recurring bills (v1.1)
-- =========================

create table public.recurring_bills (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  amount        numeric not null,
  provider_name text not null,
  description   text,
  category      text not null,
  frequency     text not null check (frequency in ('weekly', 'monthly', 'quarterly', 'yearly')),
  next_due_date date not null,
  created_at    timestamptz not null default now()
);

create index recurring_bills_user_id_idx on public.recurring_bills (user_id);
create index recurring_bills_profile_id_idx on public.recurring_bills (profile_id);
create index recurring_bills_profile_due_idx on public.recurring_bills (profile_id, next_due_date);

alter table public.recurring_bills enable row level security;

create policy recurring_bills_select_active_profile
on public.recurring_bills
for select
using (
  profile_id in (
    select active_profile_id from public.account_settings where account_id = auth.uid()
  )
);

create policy recurring_bills_insert_active_profile
on public.recurring_bills
for insert
with check (
  profile_id in (
    select active_profile_id from public.account_settings where account_id = auth.uid()
  )
);

create policy recurring_bills_update_own_profiles
on public.recurring_bills
for update
using (
  profile_id in (
    select id from public.profiles where account_id = auth.uid()
  )
)
with check (
  profile_id in (
    select id from public.profiles where account_id = auth.uid()
  )
);

create policy recurring_bills_delete_own_profiles
on public.recurring_bills
for delete
using (
  profile_id in (
    select id from public.profiles where account_id = auth.uid()
  )
);
