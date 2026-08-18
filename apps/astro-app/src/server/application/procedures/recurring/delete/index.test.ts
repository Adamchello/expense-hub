import {
  buildContext,
  buildSupabaseMock,
} from "@/server/__tests__/supabase-mock";
import { deleteRecurringPayment } from "./index";

const mock = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock("@/shared/data-sources/supabase-server", () => ({
  createSupabaseServerClient: () => mock.db,
}));

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const user = { id: "user-1", email: "e2e@test.com" };
const validId = "11111111-1111-1111-1111-111111111111";
const recurringRow = {
  id: validId,
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

describe("deleteRecurringPayment procedure", () => {
  it("returns the deleted recurring payment when the row exists", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { recurring_payments: { data: recurringRow } },
    });

    const result = await deleteRecurringPayment(
      { id: validId },
      buildContext(),
    );

    expect(result).toEqual({ code: 200, data: recurringRow });
  });

  it("returns 401 when there is no authenticated user", async () => {
    mock.db = buildSupabaseMock({ user: null });

    const result = await deleteRecurringPayment(
      { id: validId },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 401, type: "unauthorized" });
  });

  it("returns 404 when no matching row is deleted", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { recurring_payments: { data: null } },
    });

    const result = await deleteRecurringPayment(
      { id: validId },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 404, type: "not-found" });
  });

  it("returns 500 when the delete query fails", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { recurring_payments: { error: { message: "db down" } } },
    });

    const result = await deleteRecurringPayment(
      { id: validId },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
  });

  it("returns 400 when the id is not a valid uuid", async () => {
    mock.db = buildSupabaseMock({ user });

    const result = await deleteRecurringPayment(
      { id: "not-a-uuid" },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 400, type: "bad-request" });
  });
});
