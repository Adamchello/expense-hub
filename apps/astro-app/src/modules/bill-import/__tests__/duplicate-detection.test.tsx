import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "@/__tests__/mock-server";
import { http, HttpResponse } from "msw";
import { queryClient } from "@/lib/query-client";
import { BillImport } from "../presentation/bill-import";

// parseDate("2024-01-15") creates new Date(2024, 0, 15) then calls toISOString().
// In non-UTC timezones this can shift the date. We replicate the same logic here
// so the existing bill's date matches what the parser produces.
function parsedDateFor(isoInput: string): string {
  const [y, m, d] = isoInput.split("-").map(Number);
  return new Date(y, m - 1, d).toISOString().split("T")[0];
}

const CSV_DATE = "2024-01-15";
const PARSED_DATE = parsedDateFor(CSV_DATE);

const EXISTING_BILL = {
  id: "existing-1",
  amount: 15.99,
  date: PARSED_DATE,
  provider_name: "Netflix",
  description: null,
  category: "Streaming",
  created_at: "2024-01-01T00:00:00Z",
};

beforeEach(() => {
  queryClient.clear();
  queryClient.setDefaultOptions({
    queries: { retry: false, staleTime: Infinity },
  });
  queryClient.setQueryData(["bills"], [EXISTING_BILL]);
  server.use(
    http.get("/api/bills/list", () =>
      HttpResponse.json({ data: [EXISTING_BILL] }),
    ),
    http.post("/api/bills/import", () => HttpResponse.json({ imported: 2 })),
  );
});

async function uploadCSVAndWaitForReview(csvContent: string) {
  const user = userEvent.setup();
  render(<BillImport open={true} onOpenChange={() => {}} />);

  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  const file = new File([csvContent], "bills.csv", { type: "text/csv" });
  await user.upload(input, file);

  await screen.findByText("Review Import", {}, { timeout: 3000 });
  return user;
}

describe("Duplicate Detection", () => {
  it("flags row matching existing bill on provider, amount, and date", async () => {
    const csv = [
      "amount,date,provider",
      `15.99,${CSV_DATE},Netflix`,
      "25.00,2024-03-01,Spotify",
    ].join("\n");

    await uploadCSVAndWaitForReview(csv);

    const matches = screen.getAllByText(/potential duplicate/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("does NOT flag row with same provider and date but different amount", async () => {
    const csv = [
      "amount,date,provider",
      `19.99,${CSV_DATE},Netflix`,
      "25.00,2024-03-01,Spotify",
    ].join("\n");

    await uploadCSVAndWaitForReview(csv);

    expect(screen.queryByText(/potential duplicate/i)).not.toBeInTheDocument();
  });

  it("does NOT flag row with same provider and amount but different date", async () => {
    const csv = [
      "amount,date,provider",
      "15.99,2024-02-15,Netflix",
      "25.00,2024-03-01,Spotify",
    ].join("\n");

    await uploadCSVAndWaitForReview(csv);

    expect(screen.queryByText(/potential duplicate/i)).not.toBeInTheDocument();
  });

  it("does NOT flag row with same amount and date but different provider", async () => {
    const csv = [
      "amount,date,provider",
      `15.99,${CSV_DATE},Spotify`,
      "25.00,2024-03-01,Hulu",
    ].join("\n");

    await uploadCSVAndWaitForReview(csv);

    expect(screen.queryByText(/potential duplicate/i)).not.toBeInTheDocument();
  });

  it("allows finalizing import even with duplicate-flagged rows", async () => {
    const csv = [
      "amount,date,provider",
      `15.99,${CSV_DATE},Netflix`,
      "25.00,2024-03-01,Spotify",
    ].join("\n");

    const user = await uploadCSVAndWaitForReview(csv);

    const importButton = screen.getByRole("button", {
      name: /Import \d+ Bills/i,
    });
    expect(importButton).toBeEnabled();

    await user.click(importButton);

    const successMsg = await screen.findByText(
      /Successfully imported/,
      {},
      { timeout: 3000 },
    );
    expect(successMsg).toBeInTheDocument();
  });
});
