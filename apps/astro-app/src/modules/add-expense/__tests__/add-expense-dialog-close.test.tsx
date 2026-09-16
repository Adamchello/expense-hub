import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/__tests__/mock-server";
import { queryClient } from "@/libs/api/query-client";
import { $toasts } from "@/libs/ui/toast";
import { AddExpenseDialogView } from "../presentation/add-expense-dialog";

const savedRow = {
  id: "11111111-1111-4111-8111-111111111111",
  user_id: "user-1",
  profile_id: "profile-1",
  amount: 42.5,
  date: "2026-09-01",
  provider_name: "Netflix",
  category: "Streaming",
  description: null,
  created_at: "2026-09-01T10:00:00.000Z",
};

beforeEach(() => {
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  $toasts.set([]);
  server.use(
    http.get("/api/expenses/list", () => HttpResponse.json({ data: [] })),
    http.get("/api/categories/list", () => HttpResponse.json({ data: [] })),
    http.post("/api/expenses/suggest-category", () =>
      HttpResponse.json({ code: 200, category: "Streaming" }),
    ),
  );
});

const fillAndSave = async () => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/how much/i), "42.50");
  await user.click(screen.getByRole("button", { name: /add details/i }));
  await user.type(screen.getByLabelText(/who did you pay/i), "Netflix");
  await user.click(screen.getByRole("button", { name: /save expense/i }));
};

describe("AddExpenseDialogView after saving", () => {
  it("asks to close and confirms with a toast once the expense is saved", async () => {
    server.use(
      http.post("/api/expenses/create", () =>
        HttpResponse.json({ code: 201, data: savedRow }, { status: 201 }),
      ),
    );
    const onOpenChange = vi.fn();
    render(<AddExpenseDialogView open onOpenChange={onOpenChange} />);

    await fillAndSave();

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect($toasts.get()).toEqual([
      expect.objectContaining({ variant: "success", message: "Expense saved" }),
    ]);
  });

  it("stays open with the error when the save is rejected", async () => {
    server.use(
      http.post("/api/expenses/create", () =>
        HttpResponse.json(
          { code: 400, type: "bad-request", message: "Amount is too large" },
          { status: 400 },
        ),
      ),
    );
    const onOpenChange = vi.fn();
    render(<AddExpenseDialogView open onOpenChange={onOpenChange} />);

    await fillAndSave();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Amount is too large",
    );
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
