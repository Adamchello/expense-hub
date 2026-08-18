import {
  buildContext,
  buildSupabaseMock,
} from "@/server/__tests__/supabase-mock";
import { createCategory } from "./index";

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

const withActiveProfile = (tables: Record<string, unknown>) => ({
  user,
  tables: {
    account_settings: { data: { active_profile_id: "profile-1" } },
    ...tables,
  },
});

describe("createCategory procedure", () => {
  it("returns the created category on success", async () => {
    mock.db = buildSupabaseMock(
      withActiveProfile({ custom_categories: { data: categoryRow } }),
    );

    const result = await createCategory(
      { name: "Coffee", color: "amber" },
      buildContext(),
    );

    expect(result).toEqual({ code: 201, data: categoryRow });
  });

  it("returns 401 when there is no authenticated user", async () => {
    mock.db = buildSupabaseMock({ user: null });

    const result = await createCategory(
      { name: "Coffee", color: "amber" },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 401, type: "unauthorized" });
  });

  it("returns 409 when no active profile is selected", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { account_settings: { data: null } },
    });

    const result = await createCategory(
      { name: "Coffee", color: "amber" },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 409, type: "conflict" });
  });

  it("returns 409 when the name collides with a built-in category", async () => {
    mock.db = buildSupabaseMock(withActiveProfile({}));

    const result = await createCategory(
      { name: "Rent", color: "amber" },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 409, type: "conflict" });
  });

  it("returns 409 when a category with the same name already exists", async () => {
    mock.db = buildSupabaseMock(
      withActiveProfile({ custom_categories: { error: { code: "23505" } } }),
    );

    const result = await createCategory(
      { name: "Coffee", color: "amber" },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 409, type: "conflict" });
  });

  it("returns 500 when the insert fails", async () => {
    mock.db = buildSupabaseMock(
      withActiveProfile({
        custom_categories: { error: { message: "db down" } },
      }),
    );

    const result = await createCategory(
      { name: "Coffee", color: "amber" },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
  });

  it("returns 400 when the name is empty", async () => {
    mock.db = buildSupabaseMock(withActiveProfile({}));

    const result = await createCategory(
      { name: "", color: "amber" },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 400, type: "bad-request" });
  });
});
