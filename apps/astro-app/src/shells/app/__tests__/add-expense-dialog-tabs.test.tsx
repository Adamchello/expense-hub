import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "@/__tests__/mock-server";
import { http, HttpResponse } from "msw";
import { queryClient } from "@/lib/query-client";
import { AddExpenseDialog } from "../add-expense-dialog";

beforeEach(() => {
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  server.use(
    http.get("/api/expenses/list", () => HttpResponse.json({ data: [] })),
    http.get("/api/categories/list", () => HttpResponse.json({ data: [] })),
  );
});

const switchTo = async (
  user: ReturnType<typeof userEvent.setup>,
  name: RegExp,
) => user.click(screen.getByRole("tab", { name }));

const SINGLE_TAB = /single expense/i;
const IMPORT_TAB = /import file/i;

describe("AddExpenseDialog tab state", () => {
  it("keeps the single-expense form filled in after switching tabs", async () => {
    const user = userEvent.setup();
    render(<AddExpenseDialog open onOpenChange={() => {}} />);

    const amount = screen.getByLabelText(/how much/i);
    await user.type(amount, "42.50");
    expect(amount).toHaveValue(42.5);

    await switchTo(user, IMPORT_TAB);
    await switchTo(user, SINGLE_TAB);

    expect(screen.getByLabelText(/how much/i)).toHaveValue(42.5);
  });

  it("keeps the expanded details section and its values after switching tabs", async () => {
    const user = userEvent.setup();
    render(<AddExpenseDialog open onOpenChange={() => {}} />);

    await user.click(screen.getByRole("button", { name: /add details/i }));
    await user.type(screen.getByLabelText(/who did you pay/i), "Netflix");

    await switchTo(user, IMPORT_TAB);
    await switchTo(user, SINGLE_TAB);

    expect(screen.getByLabelText(/who did you pay/i)).toHaveValue("Netflix");
  });

  it("keeps a reviewed import on the review step after switching tabs", async () => {
    const user = userEvent.setup();
    render(
      <AddExpenseDialog open onOpenChange={() => {}} initialTab="import" />,
    );

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const csvContent = [
      "amount,date,provider",
      "100.00,2024-01-15,Netflix",
      "50.00,2024-02-20,Spotify",
    ].join("\n");
    await user.upload(
      input,
      new File([csvContent], "expenses.csv", { type: "text/csv" }),
    );

    await screen.findByText("Review Import", {}, { timeout: 3000 });

    await switchTo(user, SINGLE_TAB);
    await switchTo(user, IMPORT_TAB);

    expect(screen.getByText("Review Import")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Netflix")).toBeInTheDocument();
  });
});
