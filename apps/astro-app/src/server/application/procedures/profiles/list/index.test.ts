import {
  buildContext,
  buildSupabaseMock,
} from "@/server/__tests__/supabase-mock";
import { listProfiles } from "./index";

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

describe("listProfiles procedure", () => {
  it("returns the profiles for the account", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { profiles: { data: [profileRow] } },
    });

    const result = await listProfiles({}, buildContext());

    expect(result).toEqual({ code: 200, data: [profileRow] });
  });

  it("returns an empty list when there are no profiles", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { profiles: { data: null } },
    });

    const result = await listProfiles({}, buildContext());

    expect(result).toEqual({ code: 200, data: [] });
  });

  it("returns 401 when there is no authenticated user", async () => {
    mock.db = buildSupabaseMock({ user: null });

    const result = await listProfiles({}, buildContext());

    expect(result).toMatchObject({ code: 401, type: "unauthorized" });
  });

  it("returns 500 when the list query fails", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { profiles: { error: { message: "db down" } } },
    });

    const result = await listProfiles({}, buildContext());

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
  });
});
