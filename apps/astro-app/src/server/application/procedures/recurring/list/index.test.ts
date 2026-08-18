import {
  buildContext,
  buildSupabaseMock,
} from "@/server/__tests__/supabase-mock";
import { listRecurringPayments } from "./index";

const mock = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock("@/shared/data-sources/supabase-server", () => ({
  createSupabaseServerClient: () => mock.db,
}));

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const user = { id: "user-1", email: "e2e@test.com" };
const activeProfile = { data: { active_profile_id: "profile-1" } };
const recurringRow = {
  id: "11111111-1111-1111-1111-111111111111",
  user_id: "user-1",
  profile_id: "profile-1",
  amount: 12.99,
  provider_name: "Netflix",
  description: null,
  category: "Streaming",
  frequency: "monthly",
  next_due_date: "2026-02-01",
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("listRecurringPayments procedure", () => {
  it("materializes due payments and returns the list for the active profile", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: {
        account_settings: activeProfile,
        recurring_payments: { data: [recurringRow] },
      },
      rpc: { materialize_due_recurring_expenses: { data: 2 } },
    });

    const result = await listRecurringPayments({}, buildContext());

    expect(result).toEqual({
      code: 200,
      data: { expenses: [recurringRow], materialized: 2 },
    });
  });

  it("returns 401 when there is no authenticated user", async () => {
    mock.db = buildSupabaseMock({ user: null });

    const result = await listRecurringPayments({}, buildContext());

    expect(result).toMatchObject({ code: 401, type: "unauthorized" });
  });

  it("returns 409 when no active profile is selected", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { account_settings: { data: null } },
    });

    const result = await listRecurringPayments({}, buildContext());

    expect(result).toMatchObject({ code: 409, type: "conflict" });
  });

  it("returns 500 when materializing due payments fails", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { account_settings: activeProfile },
      rpc: {
        materialize_due_recurring_expenses: { error: { message: "db down" } },
      },
    });

    const result = await listRecurringPayments({}, buildContext());

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
  });

  it("returns 500 when the list query fails", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: {
        account_settings: activeProfile,
        recurring_payments: { error: { message: "db down" } },
      },
      rpc: { materialize_due_recurring_expenses: { data: 0 } },
    });

    const result = await listRecurringPayments({}, buildContext());

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
  });
});
