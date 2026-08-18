import {
  buildContext,
  buildSupabaseMock,
} from "@/server/__tests__/supabase-mock";
import { renameProfile } from "./index";

const mock = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock("@/shared/data-sources/supabase-server", () => ({
  createSupabaseServerClient: () => mock.db,
}));

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const user = { id: "user-1", email: "e2e@test.com" };
const validId = "11111111-1111-1111-1111-111111111111";
const profileRow = {
  id: validId,
  name: "Renamed",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
};

const validInput = { id: validId, name: "Renamed" };

describe("renameProfile procedure", () => {
  it("returns the renamed profile when it exists", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { profiles: { data: profileRow } },
    });

    const result = await renameProfile(validInput, buildContext());

    expect(result).toEqual({ code: 200, data: profileRow });
  });

  it("returns 401 when there is no authenticated user", async () => {
    mock.db = buildSupabaseMock({ user: null });

    const result = await renameProfile(validInput, buildContext());

    expect(result).toMatchObject({ code: 401, type: "unauthorized" });
  });

  it("returns 404 when the profile is not found", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { profiles: { data: null } },
    });

    const result = await renameProfile(validInput, buildContext());

    expect(result).toMatchObject({ code: 404, type: "not-found" });
  });

  it("returns 409 when the new name already exists", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { profiles: { error: { code: "23505" } } },
    });

    const result = await renameProfile(validInput, buildContext());

    expect(result).toMatchObject({ code: 409, type: "conflict" });
  });

  it("returns 500 when the update fails for another reason", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { profiles: { error: { message: "db down" } } },
    });

    const result = await renameProfile(validInput, buildContext());

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
  });

  it("returns 400 when the id is not a valid uuid", async () => {
    mock.db = buildSupabaseMock({ user });

    const result = await renameProfile(
      { ...validInput, id: "not-a-uuid" },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 400, type: "bad-request" });
  });
});
