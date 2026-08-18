import {
  buildContext,
  buildSupabaseMock,
} from "@/server/__tests__/supabase-mock";
import { bulkDeleteExpenses } from "./index";

const mock = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock("@/shared/data-sources/supabase-server", () => ({
  createSupabaseServerClient: () => mock.db,
}));

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const user = { id: "user-1", email: "e2e@test.com" };
const idA = "11111111-1111-1111-1111-111111111111";
const idB = "22222222-2222-2222-2222-222222222222";

describe("bulkDeleteExpenses procedure", () => {
  it("reports how many rows were deleted", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { expenses: { data: [{ id: idA }, { id: idB }] } },
    });

    const result = await bulkDeleteExpenses(
      { ids: [idA, idB] },
      buildContext(),
    );

    expect(result).toEqual({ code: 200, data: { deleted: 2 } });
  });

  it("reports zero when nothing matched", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { expenses: { data: [] } },
    });

    const result = await bulkDeleteExpenses({ ids: [idA] }, buildContext());

    expect(result).toEqual({ code: 200, data: { deleted: 0 } });
  });

  it("returns 401 when there is no authenticated user", async () => {
    mock.db = buildSupabaseMock({ user: null });

    const result = await bulkDeleteExpenses({ ids: [idA] }, buildContext());

    expect(result).toMatchObject({ code: 401, type: "unauthorized" });
  });

  it("returns 500 when the delete query fails", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { expenses: { error: { message: "db down" } } },
    });

    const result = await bulkDeleteExpenses({ ids: [idA] }, buildContext());

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
  });

  it("returns 400 when no ids are provided", async () => {
    mock.db = buildSupabaseMock({ user });

    const result = await bulkDeleteExpenses({ ids: [] }, buildContext());

    expect(result).toMatchObject({ code: 400, type: "bad-request" });
  });
});
