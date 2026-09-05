import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "@/__tests__/mock-server";
import { http, HttpResponse } from "msw";
import { queryClient } from "@/libs/api/query-client";
import { ExpenseImport } from "../presentation/expense-import";

const extractCalls: unknown[] = [];

beforeEach(() => {
  extractCalls.length = 0;
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  server.use(
    http.get("/api/expenses/list", () => HttpResponse.json({ data: [] })),
    http.post("/api/expenses/extract", async ({ request }) => {
      extractCalls.push(await request.json());
      return HttpResponse.json({
        code: 200,
        rows: [
          {
            amount: 12.5,
            date: "2024-03-01",
            providerName: "Netflix",
            description: null,
            category: "Streaming",
          },
        ],
        warnings: [],
      });
    }),
  );
});

const uploadCsv = async (lines: string[]) => {
  const user = userEvent.setup();
  render(<ExpenseImport open={true} onOpenChange={() => {}} />);
  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  const file = new File([lines.join("\n")], "bank.csv", { type: "text/csv" });
  await user.upload(input, file);
};

describe("AI fallback for unrecognized spreadsheets", () => {
  it("does not call the model when the headers are recognized", async () => {
    await uploadCsv(["amount,date,provider", "100.00,2024-01-15,Netflix"]);

    await screen.findByText("Review import", {}, { timeout: 3000 });

    expect(extractCalls).toHaveLength(0);
  });

  it("sends headers and rows to the model when columns cannot be identified", async () => {
    await uploadCsv(["Data,Kwota,Odbiorca", '2024-03-01,"12,50",Netflix']);

    await screen.findByText("Review import", {}, { timeout: 3000 });

    expect(extractCalls).toEqual([
      {
        kind: "rows",
        fileName: "bank.csv",
        headers: ["Data", "Kwota", "Odbiorca"],
        rows: [["2024-03-01", "12,50", "Netflix"]],
      },
    ]);
    expect(screen.getByDisplayValue("Netflix")).toBeInTheDocument();
  });

  it("sends only the first 500 rows and warns about the rest", async () => {
    const dataRows = Array.from(
      { length: 501 },
      (_, i) => `2024-03-01,${i + 1},Sklep ${i + 1}`,
    );
    await uploadCsv(["Data,Kwota,Odbiorca", ...dataRows]);

    await screen.findByText("Review import", {}, { timeout: 5000 });

    expect(extractCalls).toHaveLength(1);
    expect((extractCalls[0] as { rows: unknown[] }).rows).toHaveLength(500);
    expect(
      screen.getByText(/Only the first 500 rows were read/),
    ).toBeInTheDocument();
  });

  it("falls back to the model for header-less files", async () => {
    await uploadCsv(["2024-03-01,12.50,Netflix", "2024-03-02,9.99,Spotify"]);

    await screen.findByText("Review import", {}, { timeout: 3000 });

    expect(extractCalls).toHaveLength(1);
    expect(extractCalls[0]).toMatchObject({
      kind: "rows",
      rows: [
        ["2024-03-01", "12.50", "Netflix"],
        ["2024-03-02", "9.99", "Spotify"],
      ],
    });
  });
});
