-- =========================
-- Recurring expenses (v1.1)
-- =========================

create table public.recurring_payments (
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

create index recurring_payments_user_id_idx on public.recurring_payments (user_id);
create index recurring_payments_profile_id_idx on public.recurring_payments (profile_id);
create index recurring_payments_profile_due_idx on public.recurring_payments (profile_id, next_due_date);

alter table public.recurring_payments enable row level security;

create policy recurring_payments_select_active_profile
on public.recurring_payments
for select
using (
  profile_id in (
    select active_profile_id from public.account_settings where account_id = auth.uid()
  )
);

create policy recurring_payments_insert_active_profile
on public.recurring_payments
for insert
with check (
  profile_id in (
    select active_profile_id from public.account_settings where account_id = auth.uid()
  )
);

create policy recurring_payments_update_own_profiles
on public.recurring_payments
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

create policy recurring_payments_delete_own_profiles
on public.recurring_payments
for delete
using (
  profile_id in (
    select id from public.profiles where account_id = auth.uid()
  )
);

grant select, insert, update, delete on public.recurring_payments to authenticated, service_role;
