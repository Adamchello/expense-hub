import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/__tests__/mock-server";
import { $toasts } from "@/libs/ui/toast";
import { AccountFooter } from "../account-footer";

describe("AccountFooter sign out", () => {
  beforeEach(() => {
    $toasts.set([]);
  });

  it("reports a failed sign-out as an error toast instead of leaving the page", async () => {
    server.use(
      http.post("/api/auth/signout", () =>
        HttpResponse.json(
          { code: 500, type: "internal-server", message: "Session store down" },
          { status: 500 },
        ),
      ),
    );
    render(<AccountFooter email="someone@example.com" />);

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() =>
      expect($toasts.get()).toEqual([
        expect.objectContaining({
          variant: "error",
          message: "Session store down",
        }),
      ]),
    );
    expect(screen.getByRole("button", { name: /sign out/i })).toBeEnabled();
  });
});
