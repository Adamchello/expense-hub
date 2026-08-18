import {
  buildContext,
  buildSupabaseMock,
} from "@/server/__tests__/supabase-mock";
import { deleteProfile } from "./index";

const mock = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock("@/shared/data-sources/supabase-server", () => ({
  createSupabaseServerClient: () => mock.db,
}));

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const user = { id: "user-1", email: "e2e@test.com" };
const targetId = "11111111-1111-1111-1111-111111111111";
const otherId = "22222222-2222-2222-2222-222222222222";

describe("deleteProfile procedure", () => {
  it("deletes the profile when it exists and is not the last one", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: {
        // List profiles, then the final delete query (error-only check).
        profiles: [
          {
            data: [
              { id: targetId, created_at: "2026-01-01T00:00:00.000Z" },
              { id: otherId, created_at: "2026-01-02T00:00:00.000Z" },
            ],
          },
          { data: null },
        ],
        // Active profile is a different one, so no reassignment happens.
        account_settings: { data: { active_profile_id: otherId } },
      },
    });

    const result = await deleteProfile({ id: targetId }, buildContext());

    expect(result).toEqual({ code: 200, deleted: true });
  });

  it("returns 401 when there is no authenticated user", async () => {
    mock.db = buildSupabaseMock({ user: null });

    const result = await deleteProfile({ id: targetId }, buildContext());

    expect(result).toMatchObject({ code: 401, type: "unauthorized" });
  });

  it("returns 500 when loading the profiles fails", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { profiles: { error: { message: "db down" } } },
    });

    const result = await deleteProfile({ id: targetId }, buildContext());

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
  });

  it("returns 404 when the profile is not found", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: {
        profiles: {
          data: [
            { id: otherId, created_at: "2026-01-01T00:00:00.000Z" },
            {
              id: "33333333-3333-3333-3333-333333333333",
              created_at: "2026-01-02T00:00:00.000Z",
            },
          ],
        },
      },
    });

    const result = await deleteProfile({ id: targetId }, buildContext());

    expect(result).toMatchObject({ code: 404, type: "not-found" });
  });

  it("returns 409 when deleting the last remaining profile", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: {
        profiles: {
          data: [{ id: targetId, created_at: "2026-01-01T00:00:00.000Z" }],
        },
      },
    });

    const result = await deleteProfile({ id: targetId }, buildContext());

    expect(result).toMatchObject({ code: 409, type: "conflict" });
  });

  it("returns 400 when the id is not a valid uuid", async () => {
    mock.db = buildSupabaseMock({ user });

    const result = await deleteProfile({ id: "not-a-uuid" }, buildContext());

    expect(result).toMatchObject({ code: 400, type: "bad-request" });
  });
});
