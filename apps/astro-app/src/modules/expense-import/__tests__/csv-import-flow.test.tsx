import { render, screen } from "@testing-library/react";
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

describe("CSV Import Flow", () => {
  // REQ1: Upload step shows "Import Expenses" heading and file drop zone
  it("shows Import Expenses heading when dialog opens", () => {
    render(<ExpenseImport open={true} onOpenChange={() => {}} />);
    expect(screen.getByText("Import Expenses")).toBeInTheDocument();
  });

  it("shows file drop zone with drag and drop prompt", () => {
    render(<ExpenseImport open={true} onOpenChange={() => {}} />);
    expect(
      screen.getByText("Drag and drop your file here"),
    ).toBeInTheDocument();
  });

  // REQ2: Upload instructions visible
  it("displays upload instructions text", () => {
    render(<ExpenseImport open={true} onOpenChange={() => {}} />);
    expect(screen.getByText(/Upload a CSV or Excel file/)).toBeInTheDocument();
  });

  // REQ3: Template download link visible
  it("shows template download link", () => {
    render(<ExpenseImport open={true} onOpenChange={() => {}} />);
    expect(screen.getByText("Download template file")).toBeInTheDocument();
  });

  // REQ4: Drop zone shows accepted formats text
  it("shows supported file formats", () => {
    render(<ExpenseImport open={true} onOpenChange={() => {}} />);
    expect(screen.getByText(/Supports CSV, XLS, and XLSX/)).toBeInTheDocument();
  });

  // REQ5: Valid CSV produces reviewable rows
  it("transitions to review step after uploading a valid CSV", async () => {
    const user = userEvent.setup();
    render(<ExpenseImport open={true} onOpenChange={() => {}} />);

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const csvContent = [
      "amount,date,provider",
      "100.00,2024-01-15,Netflix",
      "50.00,2024-02-20,Spotify",
      "75.50,2024-03-10,Electric Company",
    ].join("\n");

    const file = new File([csvContent], "expenses.csv", { type: "text/csv" });
    await user.upload(input, file);

    // If file parsing works in jsdom, we should see the review heading
    const reviewHeading = await screen.findByText(
      "Review Import",
      {},
      { timeout: 3000 },
    );
    expect(reviewHeading).toBeInTheDocument();
  });

  // REQ6: Empty/header-only CSV shows error
  it("shows error for CSV with only headers and no data rows", async () => {
    const user = userEvent.setup();
    render(<ExpenseImport open={true} onOpenChange={() => {}} />);

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const csvContent = "amount,date,provider\n";
    const file = new File([csvContent], "empty.csv", { type: "text/csv" });
    await user.upload(input, file);

    const errorMsg = await screen.findByText(
      /empty|no data|no valid/i,
      {},
      { timeout: 3000 },
    );
    expect(errorMsg).toBeInTheDocument();
  });
});
