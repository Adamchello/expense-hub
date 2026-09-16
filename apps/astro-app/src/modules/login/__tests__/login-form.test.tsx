import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/__tests__/mock-server";
import { LoginForm } from "../presentation/main";

vi.mock("@/shared/auth/use-app-redirection-when-logged-in", () => ({
  useAppRedirectionWhenLoggedIn: () => {},
}));

const fillAndSubmit = async () => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email"), "someone@example.com");
  await user.type(screen.getByLabelText("Password"), "wrong-password");
  await user.click(screen.getByRole("button", { name: "Login" }));
  return user;
};

describe("LoginForm", () => {
  it("shows the server's message inline when credentials are rejected", async () => {
    server.use(
      http.post("/api/auth/signin", () =>
        HttpResponse.json(
          {
            code: 401,
            type: "unauthorized",
            message: "Invalid email or password",
          },
          { status: 401 },
        ),
      ),
    );
    render(<LoginForm />);

    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password",
    );
    expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
  });

  it("falls back to a generic message when the server sends none", async () => {
    server.use(
      http.post(
        "/api/auth/signin",
        () => new HttpResponse(null, { status: 500 }),
      ),
    );
    render(<LoginForm />);

    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not sign in. Please try again.",
    );
  });

  it("submits the credentials as JSON and disables the button while pending", async () => {
    let received: unknown;
    let release!: () => void;
    const opened = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.post("/api/auth/signin", async ({ request }) => {
        received = await request.json();
        await opened;
        return HttpResponse.json(
          { code: 401, type: "unauthorized", message: "nope" },
          { status: 401 },
        );
      }),
    );
    render(<LoginForm />);

    await fillAndSubmit();

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /signing in/i }),
      ).toBeDisabled(),
    );
    expect(received).toEqual({
      email: "someone@example.com",
      password: "wrong-password",
    });
    release();
    await screen.findByRole("alert");
  });
});
