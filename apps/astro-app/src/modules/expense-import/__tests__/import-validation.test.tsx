import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "@/__tests__/mock-server";
import { http, HttpResponse } from "msw";
import { queryClient } from "@/lib/query-client";
import { ExpenseImport } from "../presentation/expense-import";

beforeEach(() => {
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  server.use(
    http.get("/api/expenses/list", () => HttpResponse.json({ data: [] })),
    http.post("/api/expenses/import", () => HttpResponse.json({ imported: 3 })),
  );
});

async function uploadCSVAndWaitForReview(csvContent: string) {
  const user = userEvent.setup();
  render(<ExpenseImport open={true} onOpenChange={() => {}} />);

  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  const file = new File([csvContent], "expenses.csv", { type: "text/csv" });
  await user.upload(input, file);

  await screen.findByText("Review Import", {}, { timeout: 3000 });
  return user;
}

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split("T")[0];

describe("Import Validation", () => {
  // REQ7: Negative amount row highlighted
  it("shows error for row with negative amount", async () => {
    const csv = [
      "amount,date,provider",
      "-50,2024-01-15,Netflix",
      "100,2024-02-20,Spotify",
    ].join("\n");

    await uploadCSVAndWaitForReview(csv);

    expect(
      screen.getByText(/Amount must be a positive number/),
    ).toBeInTheDocument();
  });

  // REQ8: Future date row highlighted
  it("shows error for row with future date", async () => {
    const csv = [
      "amount,date,provider",
      `100,${tomorrowStr},Netflix`,
      "50,2024-02-20,Spotify",
    ].join("\n");

    await uploadCSVAndWaitForReview(csv);

    expect(
      screen.getByText(/Date cannot be in the future/),
    ).toBeInTheDocument();
  });

  // REQ9: Empty provider row highlighted
  it("shows error for row with empty provider", async () => {
    const csv = [
      "amount,date,provider",
      "100,2024-01-15,",
      "50,2024-02-20,Spotify",
    ].join("\n");

    await uploadCSVAndWaitForReview(csv);

    expect(screen.getByText(/Provider name is required/)).toBeInTheDocument();
  });

  // REQ10: Row with multiple errors shows all
  it("shows all errors for a row with multiple validation failures", async () => {
    const csv = [
      "amount,date,provider",
      `-50,${tomorrowStr},`,
      "100,2024-02-20,Spotify",
    ].join("\n");

    await uploadCSVAndWaitForReview(csv);

    expect(
      screen.getByText(/Amount must be a positive number/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Date cannot be in the future/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Provider name is required/)).toBeInTheDocument();
  });

  // REQ11: Stats show error count
  it("shows error count in stats summary", async () => {
    const csv = [
      "amount,date,provider",
      "-50,2024-01-15,Netflix",
      "100,2024-02-20,Spotify",
      "75,2024-03-10,Electric Company",
    ].join("\n");

    await uploadCSVAndWaitForReview(csv);

    expect(screen.getByText("3 total rows")).toBeInTheDocument();
    expect(screen.getByText(/2 ready to import/)).toBeInTheDocument();
    expect(screen.getByText(/1 with errors/)).toBeInTheDocument();
  });
});
