-- ==========================================
-- Transactional cross-table merchant rename
-- ==========================================
-- Replaces the two sequential updates in POST /api/merchants/rename.
-- Both tables update in one transaction: no more "expenses were renamed
-- but recurring payments failed" partial state.

-- SECURITY INVOKER (default): RLS policies on expenses and
-- recurring_payments apply with the caller's auth.uid().
create or replace function public.rename_merchant(p_from text, p_to text)
returns json
language plpgsql
as $$
declare
  v_expenses  integer;
  v_recurring integer;
begin
  update public.expenses
  set provider_name = p_to
  where user_id = auth.uid()
    and provider_name = p_from;
  get diagnostics v_expenses = row_count;

  update public.recurring_payments
  set provider_name = p_to
  where user_id = auth.uid()
    and provider_name = p_from;
  get diagnostics v_recurring = row_count;

  return json_build_object(
    'expenses_updated', v_expenses,
    'recurring_updated', v_recurring
  );
end;
$$;

grant execute on function public.rename_merchant(text, text) to authenticated, service_role;
