import {
  buildContext,
  buildSupabaseMock,
} from "@/server/__tests__/supabase-mock";
import { renameMerchant } from "./index";

const mock = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock("@/shared/data-sources/supabase-server", () => ({
  createSupabaseServerClient: () => mock.db,
}));

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const user = { id: "user-1", email: "e2e@test.com" };

describe("renameMerchant procedure", () => {
  it("returns the update counts on success", async () => {
    mock.db = buildSupabaseMock({
      user,
      rpc: {
        rename_merchant: {
          data: { expenses_updated: 3, recurring_updated: 1 },
        },
      },
    });

    const result = await renameMerchant(
      { from: "Amazn", to: "Amazon" },
      buildContext(),
    );

    expect(result).toEqual({
      code: 200,
      data: { expenses_updated: 3, recurring_updated: 1 },
    });
  });

  it("returns 401 when there is no authenticated user", async () => {
    mock.db = buildSupabaseMock({ user: null });

    const result = await renameMerchant(
      { from: "Amazn", to: "Amazon" },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 401, type: "unauthorized" });
  });

  it("returns 500 when the rename rpc fails", async () => {
    mock.db = buildSupabaseMock({
      user,
      rpc: { rename_merchant: { error: { message: "db down" } } },
    });

    const result = await renameMerchant(
      { from: "Amazn", to: "Amazon" },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
  });

  it("returns 400 when the new name matches the current name", async () => {
    mock.db = buildSupabaseMock({ user });

    const result = await renameMerchant(
      { from: "Amazon", to: "Amazon" },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 400, type: "bad-request" });
  });
});
