import {
  buildContext,
  buildSupabaseMock,
} from "@/server/__tests__/supabase-mock";
import { getAccountSettings } from "./index";

const mock = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock("@/shared/data-sources/supabase-server", () => ({
  createSupabaseServerClient: () => mock.db,
}));

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const user = { id: "user-1", email: "e2e@test.com" };
const settingsRow = {
  account_id: "user-1",
  active_profile_id: "profile-1",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("getAccountSettings procedure", () => {
  it("returns the settings for the authenticated account", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { account_settings: { data: settingsRow } },
    });

    const result = await getAccountSettings({}, buildContext());

    expect(result).toEqual({ code: 200, data: settingsRow });
  });

  it("returns 401 when there is no authenticated user", async () => {
    mock.db = buildSupabaseMock({ user: null });

    const result = await getAccountSettings({}, buildContext());

    expect(result).toMatchObject({ code: 401, type: "unauthorized" });
  });

  it("returns 404 when no settings row exists", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { account_settings: { data: null } },
    });

    const result = await getAccountSettings({}, buildContext());

    expect(result).toMatchObject({ code: 404, type: "not-found" });
  });

  it("returns 500 when the settings query fails", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { account_settings: { error: { message: "db down" } } },
    });

    const result = await getAccountSettings({}, buildContext());

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
  });
});
