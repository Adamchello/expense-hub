import {
  buildContext,
  buildSupabaseMock,
} from "@/server/__tests__/supabase-mock";
import { suggestExpenseCategory } from "./index";

const mock = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock("@/shared/data-sources/supabase-server", () => ({
  createSupabaseServerClient: () => mock.db,
}));

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const user = { id: "user-1", email: "e2e@test.com" };

describe("suggestExpenseCategory procedure", () => {
  it("returns a suggested category for a provider name", async () => {
    mock.db = buildSupabaseMock({ user });

    const result = await suggestExpenseCategory(
      { providerName: "Netflix" },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 200 });
    expect(result).toHaveProperty("category");
    expect(typeof (result as { category: unknown }).category).toBe("string");
  });

  it("returns 401 when there is no authenticated user", async () => {
    mock.db = buildSupabaseMock({ user: null });

    const result = await suggestExpenseCategory(
      { providerName: "Netflix" },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 401, type: "unauthorized" });
  });

  it("returns 400 when the provider name is empty", async () => {
    mock.db = buildSupabaseMock({ user });

    const result = await suggestExpenseCategory(
      { providerName: "" },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 400, type: "bad-request" });
  });
});
