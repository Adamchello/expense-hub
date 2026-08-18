import {
  buildContext,
  buildSupabaseMock,
} from "@/server/__tests__/supabase-mock";
import { registerUser } from "./index";

const mock = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock("@/shared/data-sources/supabase-server", () => ({
  createSupabaseServerClient: () => mock.db,
}));

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const credentials = { email: "e2e@test.com", password: "secret123" };

describe("registerUser procedure", () => {
  it("redirects to the dashboard when sign-up succeeds", async () => {
    mock.db = buildSupabaseMock({
      auth: { signUp: { data: {}, error: null } },
    });

    const result = await registerUser(credentials, buildContext());

    expect(result).toMatchObject({ code: 303 });
    expect(result).toHaveProperty("location");
  });

  it("returns 500 when sign-up fails", async () => {
    mock.db = buildSupabaseMock({
      auth: { signUp: { error: { message: "email taken" } } },
    });

    const result = await registerUser(credentials, buildContext());

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
  });

  it("returns 400 when the email is invalid", async () => {
    mock.db = buildSupabaseMock({
      auth: { signUp: { data: {}, error: null } },
    });

    const result = await registerUser(
      { email: "not-an-email", password: "secret123" },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 400, type: "bad-request" });
  });
});
