import {
  buildContext,
  buildSupabaseMock,
} from "@/server/__tests__/supabase-mock";
import { listCategories } from "./index";

const mock = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock("@/shared/data-sources/supabase-server", () => ({
  createSupabaseServerClient: () => mock.db,
}));

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const user = { id: "user-1", email: "e2e@test.com" };
const categoryRow = {
  id: "11111111-1111-1111-1111-111111111111",
  user_id: "user-1",
  profile_id: "profile-1",
  name: "Coffee",
  color: "amber",
  created_at: "2026-01-01T00:00:00.000Z",
};

const activeProfile = { data: { active_profile_id: "profile-1" } };

describe("listCategories procedure", () => {
  it("returns the categories for the active profile", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: {
        account_settings: activeProfile,
        custom_categories: { data: [categoryRow] },
      },
    });

    const result = await listCategories({}, buildContext());

    expect(result).toEqual({ code: 200, data: [categoryRow] });
  });

  it("returns an empty list when there are no categories", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: {
        account_settings: activeProfile,
        custom_categories: { data: null },
      },
    });

    const result = await listCategories({}, buildContext());

    expect(result).toEqual({ code: 200, data: [] });
  });

  it("returns 401 when there is no authenticated user", async () => {
    mock.db = buildSupabaseMock({ user: null });

    const result = await listCategories({}, buildContext());

    expect(result).toMatchObject({ code: 401, type: "unauthorized" });
  });

  it("returns 409 when no active profile is selected", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { account_settings: { data: null } },
    });

    const result = await listCategories({}, buildContext());

    expect(result).toMatchObject({ code: 409, type: "conflict" });
  });

  it("returns 500 when the list query fails", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: {
        account_settings: activeProfile,
        custom_categories: { error: { message: "db down" } },
      },
    });

    const result = await listCategories({}, buildContext());

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
  });
});
