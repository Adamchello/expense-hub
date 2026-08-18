import {
  buildContext,
  buildSupabaseMock,
} from "@/server/__tests__/supabase-mock";
import { updateAccountSettings } from "./index";

const mock = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock("@/shared/data-sources/supabase-server", () => ({
  createSupabaseServerClient: () => mock.db,
}));

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const user = { id: "user-1", email: "e2e@test.com" };
const activeProfileId = "11111111-1111-1111-1111-111111111111";
const settingsRow = {
  account_id: "user-1",
  active_profile_id: activeProfileId,
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("updateAccountSettings procedure", () => {
  it("returns the updated settings when the profile belongs to the account", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: {
        profiles: { data: { id: activeProfileId } },
        account_settings: { data: settingsRow },
      },
    });

    const result = await updateAccountSettings(
      { activeProfileId },
      buildContext(),
    );

    expect(result).toEqual({ code: 200, data: settingsRow });
  });

  it("returns 401 when there is no authenticated user", async () => {
    mock.db = buildSupabaseMock({ user: null });

    const result = await updateAccountSettings(
      { activeProfileId },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 401, type: "unauthorized" });
  });

  it("returns 403 when the profile does not belong to the account", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { profiles: { data: null } },
    });

    const result = await updateAccountSettings(
      { activeProfileId },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 403, type: "forbidden" });
  });

  it("returns 500 when verifying profile ownership fails", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { profiles: { error: { message: "db down" } } },
    });

    const result = await updateAccountSettings(
      { activeProfileId },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
  });

  it("returns 500 when the settings update fails", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: {
        profiles: { data: { id: activeProfileId } },
        account_settings: { error: { message: "db down" } },
      },
    });

    const result = await updateAccountSettings(
      { activeProfileId },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
  });

  it("returns 400 when the active profile id is not a valid uuid", async () => {
    mock.db = buildSupabaseMock({ user });

    const result = await updateAccountSettings(
      { activeProfileId: "not-a-uuid" },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 400, type: "bad-request" });
  });
});
