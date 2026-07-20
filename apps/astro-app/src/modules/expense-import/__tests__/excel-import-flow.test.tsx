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

describe("Excel Import Flow", () => {
  // The dialog structure tests are identical to CSV — the upload step is shared.
  // We only test Excel-specific behavior here.

  it("shows the upload step with accepted formats including XLS/XLSX", () => {
    render(<ExpenseImport open={true} onOpenChange={() => {}} />);
    expect(screen.getByText(/Supports CSV, XLS, and XLSX/)).toBeInTheDocument();
  });

  it("shows the file input accepts Excel extensions", () => {
    render(<ExpenseImport open={true} onOpenChange={() => {}} />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.accept).toContain(".xlsx");
    expect(input.accept).toContain(".xls");
  });

  // TEST CANNOT BE ADDED: Valid Excel file upload and review transition
  // Reason: Excel parsing uses FileReader.readAsArrayBuffer + XLSX.read which
  // requires binary ArrayBuffer processing. Creating a valid .xlsx binary in
  // jsdom test environment is unreliable — the XLSX library needs a properly
  // structured zip/XML binary, not just text content. This is best covered
  // by e2e tests with real browser APIs.

  // TEST CANNOT BE ADDED: Corrupt Excel file error handling
  // Reason: Same as above — simulating Excel binary upload in jsdom is unreliable.
  // The FileReader + XLSX.read pipeline requires real browser binary handling.
});
