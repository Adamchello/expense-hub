import { render, screen, within, waitFor } from "@testing-library/react";
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

function getTrashButton(row: Element): HTMLButtonElement | null {
  // The trash button is in the last <td> of each row
  const cells = row.querySelectorAll("td");
  const lastCell = cells[cells.length - 1];
  return lastCell?.querySelector("button") ?? null;
}

describe("Review Editing", () => {
  it("updates category suggestion when provider name changes to a known provider", async () => {
    const csv = [
      "amount,date,provider",
      "100,2024-01-15,Unknown Store",
      "50,2024-02-20,Spotify",
    ].join("\n");

    const user = await uploadCSVAndWaitForReview(csv);

    const providerInputs = screen.getAllByDisplayValue("Unknown Store");
    const providerInput = providerInputs[0];

    await user.clear(providerInput);
    await user.type(providerInput, "Netflix");

    // After typing "Netflix", the category auto-updates to Streaming.
    // Spotify also gets Streaming, so multiple elements expected.
    const subscriptionTexts = screen.getAllByText("Streaming");
    // Before editing there was only 1 (Spotify). Now there should be 2 (Spotify + Netflix).
    expect(subscriptionTexts.length).toBe(2);
  });

  it("removes a row and updates the total count in stats", async () => {
    const csv = [
      "amount,date,provider",
      "100,2024-01-15,Netflix",
      "50,2024-02-20,Spotify",
      "75,2024-03-10,Electric Company",
    ].join("\n");

    const user = await uploadCSVAndWaitForReview(csv);

    expect(screen.getByText("3 total rows")).toBeInTheDocument();

    const tableRows = document.querySelectorAll("tbody tr");
    expect(tableRows.length).toBe(3);

    const trashBtn = getTrashButton(tableRows[0]);
    expect(trashBtn).toBeTruthy();

    await user.click(trashBtn!);

    await waitFor(() => {
      expect(screen.getByText("2 total rows")).toBeInTheDocument();
    });
    expect(document.querySelectorAll("tbody tr").length).toBe(2);
  });

  it("removing the only invalid row clears errors from stats", async () => {
    const csv = [
      "amount,date,provider",
      "100,2024-01-15,Netflix",
      "50,2024-02-20,Spotify",
      "-25,2024-03-10,BadRow",
    ].join("\n");

    const user = await uploadCSVAndWaitForReview(csv);

    expect(screen.getByText("3 total rows")).toBeInTheDocument();
    expect(screen.getByText(/1 with errors/)).toBeInTheDocument();

    // The error row has destructive class — find it and click its trash button
    const tableRows = document.querySelectorAll("tbody tr");
    const errorRow = Array.from(tableRows).find((row) =>
      row.className.includes("destructive"),
    );
    expect(errorRow).toBeTruthy();

    const trashBtn = getTrashButton(errorRow!);
    expect(trashBtn).toBeTruthy();

    await user.click(trashBtn!);

    await waitFor(() => {
      expect(screen.getByText("2 total rows")).toBeInTheDocument();
    });
    expect(screen.getByText(/2 ready to import/)).toBeInTheDocument();
    expect(screen.queryByText(/with errors/)).not.toBeInTheDocument();
  });
});
