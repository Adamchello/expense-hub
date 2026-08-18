import {
  buildContext,
  buildSupabaseMock,
} from "@/server/__tests__/supabase-mock";
import { createProfile } from "./index";

const mock = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock("@/shared/data-sources/supabase-server", () => ({
  createSupabaseServerClient: () => mock.db,
}));

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const user = { id: "user-1", email: "e2e@test.com" };
const profileRow = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Household",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("createProfile procedure", () => {
  it("returns the created profile on success", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: {
        // First query counts existing profiles, second inserts the new one.
        profiles: [{ count: 0 }, { data: profileRow }],
      },
    });

    const result = await createProfile({ name: "Household" }, buildContext());

    expect(result).toEqual({ code: 201, data: profileRow });
  });

  it("returns 401 when there is no authenticated user", async () => {
    mock.db = buildSupabaseMock({ user: null });

    const result = await createProfile({ name: "Household" }, buildContext());

    expect(result).toMatchObject({ code: 401, type: "unauthorized" });
  });

  it("returns 500 when the profile count query fails", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { profiles: { error: { message: "db down" } } },
    });

    const result = await createProfile({ name: "Household" }, buildContext());

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
  });

  it("returns 409 when the profile limit is reached", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { profiles: { count: 10 } },
    });

    const result = await createProfile({ name: "Household" }, buildContext());

    expect(result).toMatchObject({ code: 409, type: "conflict" });
  });

  it("returns 409 when a profile with the same name already exists", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { profiles: [{ count: 0 }, { error: { code: "23505" } }] },
    });

    const result = await createProfile({ name: "Household" }, buildContext());

    expect(result).toMatchObject({ code: 409, type: "conflict" });
  });

  it("returns 500 when the insert fails for another reason", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { profiles: [{ count: 0 }, { error: { message: "db down" } }] },
    });

    const result = await createProfile({ name: "Household" }, buildContext());

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
  });

  it("returns 400 when the name is empty", async () => {
    mock.db = buildSupabaseMock({ user });

    const result = await createProfile({ name: "" }, buildContext());

    expect(result).toMatchObject({ code: 400, type: "bad-request" });
  });
});
