import {
  buildContext,
  buildSupabaseMock,
} from "@/server/__tests__/supabase-mock";
import { signinUser } from "./index";

const mock = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock("@/shared/data-sources/supabase-server", () => ({
  createSupabaseServerClient: () => mock.db,
}));

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const credentials = { email: "e2e@test.com", password: "secret123" };

describe("signinUser procedure", () => {
  it("redirects to the dashboard when sign-in succeeds", async () => {
    mock.db = buildSupabaseMock({
      auth: { signInWithPassword: { data: {}, error: null } },
    });

    const result = await signinUser(credentials, buildContext());

    expect(result).toMatchObject({ code: 303 });
    expect(result).toHaveProperty("location");
  });

  it("returns 401 when the credentials are rejected", async () => {
    mock.db = buildSupabaseMock({
      auth: {
        signInWithPassword: { error: { status: 400, message: "bad creds" } },
      },
    });

    const result = await signinUser(credentials, buildContext());

    expect(result).toMatchObject({ code: 401, type: "unauthorized" });
  });

  it("returns 500 when sign-in fails for a non-auth reason", async () => {
    mock.db = buildSupabaseMock({
      auth: {
        signInWithPassword: { error: { status: 500, message: "db down" } },
      },
    });

    const result = await signinUser(credentials, buildContext());

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
  });

  it("returns 400 when the email is invalid", async () => {
    mock.db = buildSupabaseMock({
      auth: { signInWithPassword: { data: {}, error: null } },
    });

    const result = await signinUser(
      { email: "not-an-email", password: "secret123" },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 400, type: "bad-request" });
  });
});
