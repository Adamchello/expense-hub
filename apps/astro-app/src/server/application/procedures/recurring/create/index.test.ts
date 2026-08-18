import {
  buildContext,
  buildSupabaseMock,
} from "@/server/__tests__/supabase-mock";
import { createRecurringPayment } from "./index";

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

const validInput = {
  amount: 12.99,
  providerName: "Netflix",
  category: "Streaming",
  frequency: "monthly" as const,
  nextDueDate: "2026-02-01",
};

describe("createRecurringPayment procedure", () => {
  it("returns the created recurring payment on success", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: {
        account_settings: activeProfile,
        recurring_payments: { data: recurringRow },
      },
    });

    const result = await createRecurringPayment(validInput, buildContext());

    expect(result).toEqual({ code: 201, data: recurringRow });
  });

  it("returns 401 when there is no authenticated user", async () => {
    mock.db = buildSupabaseMock({ user: null });

    const result = await createRecurringPayment(validInput, buildContext());

    expect(result).toMatchObject({ code: 401, type: "unauthorized" });
  });

  it("returns 409 when no active profile is selected", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { account_settings: { data: null } },
    });

    const result = await createRecurringPayment(validInput, buildContext());

    expect(result).toMatchObject({ code: 409, type: "conflict" });
  });

  it("returns 500 when the insert fails", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: {
        account_settings: activeProfile,
        recurring_payments: { error: { message: "db down" } },
      },
    });

    const result = await createRecurringPayment(validInput, buildContext());

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
  });

  it("returns 400 when the frequency is invalid", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { account_settings: activeProfile },
    });

    const result = await createRecurringPayment(
      { ...validInput, frequency: "daily" as never },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 400, type: "bad-request" });
  });
});
