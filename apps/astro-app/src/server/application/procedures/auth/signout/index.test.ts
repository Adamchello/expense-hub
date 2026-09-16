import { buildContext, buildSupabaseMock } from "@/libs/supabase/mock";
import { signoutUser } from "./index";

const mock = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock("@/libs/supabase/server", () => ({
  createSupabaseServerClient: () => mock.db,
}));

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("signoutUser procedure", () => {
  it("redirects to the login page when sign-out succeeds", async () => {
    mock.db = buildSupabaseMock({ auth: { signOut: { error: null } } });

    const result = await signoutUser({}, buildContext());

    expect(result).toMatchObject({ code: 303 });
    expect(result).toHaveProperty("location");
  });

  it("returns 500 when sign-out fails", async () => {
    mock.db = buildSupabaseMock({
      auth: { signOut: { error: { message: "session error" } } },
    });

    const result = await signoutUser({}, buildContext());

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
  });
});
