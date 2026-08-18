import {
  buildContext,
  buildSupabaseMock,
} from "@/server/__tests__/supabase-mock";
import { updateExpense } from "./index";

const mock = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock("@/shared/data-sources/supabase-server", () => ({
  createSupabaseServerClient: () => mock.db,
}));

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const user = { id: "user-1", email: "e2e@test.com" };
const validId = "11111111-1111-1111-1111-111111111111";
const expenseRow = {
  id: validId,
  user_id: "user-1",
  profile_id: "profile-1",
  amount: 42.5,
  date: "2026-01-01",
  provider_name: "Acme",
  description: null,
  category: "Groceries",
  created_at: "2026-01-01T00:00:00.000Z",
};

const validInput = {
  id: validId,
  amount: 42.5,
  date: "2026-01-01",
  providerName: "Acme",
  category: "Groceries",
};

describe("updateExpense procedure", () => {
  it("returns the updated expense when the row exists", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { expenses: { data: expenseRow } },
    });

    const result = await updateExpense(validInput, buildContext());

    expect(result).toEqual({ code: 200, data: expenseRow });
  });

  it("returns 401 when there is no authenticated user", async () => {
    mock.db = buildSupabaseMock({ user: null });

    const result = await updateExpense(validInput, buildContext());

    expect(result).toMatchObject({ code: 401, type: "unauthorized" });
  });

  it("returns 404 when no matching row is updated", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { expenses: { data: null } },
    });

    const result = await updateExpense(validInput, buildContext());

    expect(result).toMatchObject({ code: 404, type: "not-found" });
  });

  it("returns 500 when the update query fails", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { expenses: { error: { message: "db down" } } },
    });

    const result = await updateExpense(validInput, buildContext());

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
  });

  it("returns 400 when the id is not a valid uuid", async () => {
    mock.db = buildSupabaseMock({ user });

    const result = await updateExpense(
      { ...validInput, id: "not-a-uuid" },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 400, type: "bad-request" });
  });
});
