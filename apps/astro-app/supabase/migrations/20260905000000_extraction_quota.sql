-- ==========================================
-- Daily quota for model-backed file extraction
-- ==========================================
-- Every AI read of an import file costs money. This caps how many one
-- account can run per UTC day, enforced server-side in one atomic RPC so
-- concurrent requests cannot both slip under the limit.

create table public.extraction_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null default (now() at time zone 'utc')::date,
  count   integer not null default 0 check (count >= 0),
  primary key (user_id, day)
);

alter table public.extraction_usage enable row level security;

create policy extraction_usage_select_own
  on public.extraction_usage for select
  using (user_id = auth.uid());

-- No insert/update policies on purpose: rows change only through the RPC.
grant select on public.extraction_usage to authenticated, service_role;

-- Returns today's count after taking one unit, or -1 (and changes nothing)
-- when the account already reached p_limit.
-- SECURITY DEFINER so it can write the table the caller cannot; it only
-- ever touches the row for auth.uid().
create or replace function public.consume_extraction_quota(p_limit integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_day   date := (now() at time zone 'utc')::date;
  v_count integer;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  insert into public.extraction_usage (user_id, day, count)
  values (v_user, v_day, 0)
  on conflict (user_id, day) do nothing;

  select count into v_count
  from public.extraction_usage
  where user_id = v_user and day = v_day
  for update;

  if v_count >= p_limit then
    return -1;
  end if;

  update public.extraction_usage
  set count = v_count + 1
  where user_id = v_user and day = v_day;

  return v_count + 1;
end;
$$;

grant execute on function public.consume_extraction_quota(integer) to authenticated, service_role;
