-- =========================
-- v2.x: recurring occurrence events + custom categories
-- =========================

-- Per-occurrence outcomes for recurring expenses. An occurrence with no event is
-- Upcoming (due in the future) or Overdue (due in the past).
create table public.recurring_payment_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  recurring_id  uuid not null references public.recurring_payments(id) on delete cascade,
  due_date      date not null,
  status        text not null check (status in ('paid', 'skipped')),
  expense_id       uuid references public.expenses(id) on delete set null,
  created_at    timestamptz not null default now(),
  constraint recurring_payment_events_unique_occurrence unique (recurring_id, due_date)
);

create index recurring_payment_events_profile_due_idx
  on public.recurring_payment_events (profile_id, due_date);

alter table public.recurring_payment_events enable row level security;

create policy recurring_payment_events_select_active_profile
on public.recurring_payment_events
for select
using (
  profile_id in (
    select active_profile_id from public.account_settings where account_id = auth.uid()
  )
);

create policy recurring_payment_events_insert_active_profile
on public.recurring_payment_events
for insert
with check (
  profile_id in (
    select active_profile_id from public.account_settings where account_id = auth.uid()
  )
);

create policy recurring_payment_events_delete_own_profiles
on public.recurring_payment_events
for delete
using (
  profile_id in (
    select id from public.profiles where account_id = auth.uid()
  )
);

-- User-defined categories on top of the built-in taxonomy.
create table public.custom_categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  color       text not null default 'gray',
  created_at  timestamptz not null default now(),
  constraint custom_categories_name_length check (char_length(name) between 1 and 30),
  constraint custom_categories_unique_per_profile unique (profile_id, name)
);

create index custom_categories_profile_idx on public.custom_categories (profile_id);

alter table public.custom_categories enable row level security;

create policy custom_categories_select_active_profile
on public.custom_categories
for select
using (
  profile_id in (
    select active_profile_id from public.account_settings where account_id = auth.uid()
  )
);

create policy custom_categories_insert_active_profile
on public.custom_categories
for insert
with check (
  profile_id in (
    select active_profile_id from public.account_settings where account_id = auth.uid()
  )
);

create policy custom_categories_delete_own_profiles
on public.custom_categories
for delete
using (
  profile_id in (
    select id from public.profiles where account_id = auth.uid()
  )
);

grant select, insert, update, delete on public.recurring_payment_events to authenticated, service_role;
grant select, insert, update, delete on public.custom_categories to authenticated, service_role;
