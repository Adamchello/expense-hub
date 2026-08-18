-- ======================================================
-- Transactional materialization of due recurring expenses
-- ======================================================
-- Replaces the app-side loop in GET /api/recurring: one RPC call,
-- one transaction. Either every due occurrence is logged and the
-- schedule advanced, or nothing changes — no more duplicate charges
-- when an insert succeeded but the due-date advance failed.

-- Mirrors advanceDueDate in src/shared/domain/recurrence.ts.
-- Postgres month addition clamps to the last day of the target month
-- (Jan 31 + 1 month = Feb 28), same as the JS implementation.
create or replace function public.advance_due_date(p_date date, p_frequency text)
returns date
language sql
immutable
as $$
  select case p_frequency
    when 'weekly'    then p_date + 7
    when 'monthly'   then (p_date + interval '1 month')::date
    when 'quarterly' then (p_date + interval '3 months')::date
    when 'yearly'    then (p_date + interval '1 year')::date
  end
$$;

-- SECURITY INVOKER (default): RLS policies on expenses,
-- recurring_payment_events and recurring_payments all apply with the
-- caller's auth.uid(), so the function cannot touch foreign data.
create or replace function public.materialize_due_recurring_expenses(p_profile_id uuid)
returns integer
language plpgsql
as $$
declare
  rec        record;
  v_due      date;
  v_guard    integer;
  v_created  integer := 0;
  v_expense  uuid;
begin
  for rec in
    select id, user_id, profile_id, amount, provider_name, description,
           category, frequency, next_due_date
    from public.recurring_payments
    where profile_id = p_profile_id
      and next_due_date <= current_date
    for update
  loop
    v_due := rec.next_due_date;
    v_guard := 0;

    -- Safety cap: at most 24 missed occurrences back-filled per payment.
    while v_due <= current_date and v_guard < 24 loop
      insert into public.expenses
        (user_id, profile_id, amount, date, provider_name, description, category)
      values
        (rec.user_id, rec.profile_id, rec.amount, v_due, rec.provider_name,
         rec.description, rec.category)
      returning id into v_expense;

      insert into public.recurring_payment_events
        (user_id, profile_id, recurring_id, due_date, status, expense_id)
      values
        (rec.user_id, rec.profile_id, rec.id, v_due, 'paid', v_expense)
      on conflict (recurring_id, due_date) do nothing;

      v_due := public.advance_due_date(v_due, rec.frequency);
      v_created := v_created + 1;
      v_guard := v_guard + 1;
    end loop;

    update public.recurring_payments
    set next_due_date = v_due
    where id = rec.id;
  end loop;

  return v_created;
end;
$$;

grant execute on function public.advance_due_date(date, text) to authenticated, service_role;
grant execute on function public.materialize_due_recurring_expenses(uuid) to authenticated, service_role;
