-- =========================
-- Tables
-- =========================

create table public.profiles (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint profiles_name_length check (char_length(name) between 1 and 50),
  constraint profiles_name_unique_per_account unique (account_id, name)
);

create index profiles_account_id_idx on public.profiles (account_id);

create table public.account_settings (
  account_id         uuid primary key references auth.users(id) on delete cascade,
  active_profile_id  uuid references public.profiles(id) on delete set null,
  updated_at         timestamptz not null default now()
);

create index account_settings_active_profile_idx on public.account_settings (active_profile_id);

create table public.expenses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  amount        numeric not null,
  date          date not null,
  provider_name text not null,
  description   text,
  category      text not null,
  created_at    timestamptz not null default now()
);

create index expenses_user_id_idx on public.expenses (user_id);
create index expenses_profile_id_idx on public.expenses (profile_id);
create index expenses_profile_created_at_idx on public.expenses (profile_id, created_at desc);

-- =========================
-- Auto-create default profile + settings on signup
-- (kept in DB because Supabase auth signup has no reliable server hook in app code)
-- =========================

create or replace function public.handle_new_user_default_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
begin
  insert into public.profiles (account_id, name)
  values (new.id, 'Personal')
  returning id into v_profile_id;

  insert into public.account_settings (account_id, active_profile_id)
  values (new.id, v_profile_id);

  return new;
end;
$$;

create trigger on_auth_user_created_default_profile
after insert on auth.users
for each row execute function public.handle_new_user_default_profile();

-- =========================
-- Row Level Security
-- =========================

alter table public.profiles enable row level security;

create policy profiles_select_own
on public.profiles
for select
using (account_id = auth.uid());

create policy profiles_insert_own
on public.profiles
for insert
with check (account_id = auth.uid());

create policy profiles_update_own
on public.profiles
for update
using (account_id = auth.uid())
with check (account_id = auth.uid());

create policy profiles_delete_own
on public.profiles
for delete
using (account_id = auth.uid());

alter table public.account_settings enable row level security;

create policy account_settings_select_own
on public.account_settings
for select
using (account_id = auth.uid());

create policy account_settings_insert_own
on public.account_settings
for insert
with check (account_id = auth.uid());

create policy account_settings_update_own
on public.account_settings
for update
using (account_id = auth.uid())
with check (
  account_id = auth.uid()
  and (
    active_profile_id is null
    or active_profile_id in (select id from public.profiles where account_id = auth.uid())
  )
);

alter table public.expenses enable row level security;

create policy expenses_select_active_profile
on public.expenses
for select
using (
  profile_id in (
    select active_profile_id from public.account_settings where account_id = auth.uid()
  )
);

create policy expenses_insert_active_profile
on public.expenses
for insert
with check (
  profile_id in (
    select active_profile_id from public.account_settings where account_id = auth.uid()
  )
);

create policy expenses_update_active_profile
on public.expenses
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

create policy expenses_delete_active_profile
on public.expenses
for delete
using (
  profile_id in (
    select id from public.profiles where account_id = auth.uid()
  )
);

-- Table privileges. Supabase's default privileges are not a contract we can
-- rely on across CLI versions — without these, a fresh `db reset` produces
-- tables PostgREST cannot read ("permission denied"). RLS above still decides
-- which rows each user sees; these grants only open the door.
grant select, insert, update, delete on public.profiles to authenticated, service_role;
grant select, insert, update, delete on public.account_settings to authenticated, service_role;
grant select, insert, update, delete on public.expenses to authenticated, service_role;
