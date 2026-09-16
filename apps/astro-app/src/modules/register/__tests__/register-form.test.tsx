import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/__tests__/mock-server";
import { RegisterForm } from "../presentation/main";

vi.mock("@/shared/auth/use-app-redirection-when-logged-in", () => ({
  useAppRedirectionWhenLoggedIn: () => {},
}));

describe("RegisterForm", () => {
  it("shows the server's message inline when registration fails", async () => {
    server.use(
      http.post("/api/auth/register", () =>
        HttpResponse.json(
          {
            code: 500,
            type: "internal-server",
            message: "User already registered",
          },
          { status: 500 },
        ),
      ),
    );
    render(<RegisterForm />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "someone@example.com");
    await user.type(screen.getByLabelText("Password"), "secret-password");
    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "User already registered",
    );
    expect(screen.getByRole("button", { name: "Register" })).toBeEnabled();
  });
});
