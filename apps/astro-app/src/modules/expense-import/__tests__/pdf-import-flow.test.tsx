import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "@/__tests__/mock-server";
import { delay, http, HttpResponse } from "msw";
import { queryClient } from "@/libs/api/query-client";
import { ExpenseImport } from "../presentation/expense-import";

const extractCalls: unknown[] = [];

const extractReply = {
  rows: [
    {
      amount: 15.99,
      date: "2024-01-15",
      providerName: "Netflix",
      description: null,
      category: "Streaming",
    },
    {
      amount: 120,
      date: "2024-01-20",
      providerName: "Electric Company",
      description: "January bill",
      category: "Electricity",
    },
  ],
  warnings: ["Skipped 2 incoming transfers"],
};

beforeEach(() => {
  extractCalls.length = 0;
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  server.use(
    http.get("/api/expenses/list", () => HttpResponse.json({ data: [] })),
    http.post("/api/expenses/extract", async ({ request }) => {
      extractCalls.push(await request.json());
      return HttpResponse.json({ code: 200, ...extractReply });
    }),
  );
});

const pdfFile = (content = "%PDF-1.4 fake") =>
  new File([content], "statement.pdf", { type: "application/pdf" });

const uploadPdf = async (content = "%PDF-1.4 fake") => {
  const user = userEvent.setup();
  render(<ExpenseImport open={true} onOpenChange={() => {}} />);
  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  await user.upload(input, pdfFile(content));
  return { input, content };
};

describe("PDF Import Flow", () => {
  it("accepts PDF files in the file input", () => {
    render(<ExpenseImport open={true} onOpenChange={() => {}} />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(input.accept).toContain(".pdf");
  });

  it("sends the PDF as base64 to the extract endpoint", async () => {
    const { content } = await uploadPdf();

    await screen.findByText("Review import", {}, { timeout: 3000 });

    expect(extractCalls).toHaveLength(1);
    expect(extractCalls[0]).toEqual({
      kind: "pdf",
      fileName: "statement.pdf",
      base64: btoa(content),
    });
  });

  it("shows the extracted rows, including descriptions, in the review table", async () => {
    await uploadPdf();

    await screen.findByText("Review import", {}, { timeout: 3000 });

    expect(screen.getByDisplayValue("Netflix")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Electric Company")).toBeInTheDocument();
    expect(screen.getByDisplayValue("15.99")).toBeInTheDocument();
    expect(screen.getByDisplayValue("January bill")).toBeInTheDocument();
  });

  it("surfaces the model's warnings on the review step", async () => {
    await uploadPdf();

    await screen.findByText("Review import", {}, { timeout: 3000 });

    expect(
      screen.getByText("Skipped 2 incoming transfers"),
    ).toBeInTheDocument();
  });

  it("shows the server error on the upload step when extraction fails", async () => {
    server.use(
      http.post("/api/expenses/extract", () =>
        HttpResponse.json(
          {
            code: 500,
            type: "internal-server",
            message: "Could not read expenses from this file.",
          },
          { status: 500 },
        ),
      ),
    );

    await uploadPdf();

    expect(
      await screen.findByText(
        /Could not read expenses from this file/,
        {},
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Import expenses")).toBeInTheDocument();
  });

  it("tells the user when the model found nothing", async () => {
    server.use(
      http.post("/api/expenses/extract", () =>
        HttpResponse.json({ code: 200, rows: [], warnings: [] }),
      ),
    );

    await uploadPdf();

    expect(
      await screen.findByText(/no valid expense data/i, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  it("aborts the request and discards the result when the dialog closes mid-read", async () => {
    let aborted = false;
    server.use(
      http.post("/api/expenses/extract", async ({ request }) => {
        request.signal.addEventListener("abort", () => {
          aborted = true;
        });
        await delay(300);
        return HttpResponse.json({ code: 200, ...extractReply });
      }),
    );

    const user = userEvent.setup();
    const view = render(<ExpenseImport open={true} onOpenChange={() => {}} />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, pdfFile());
    await screen.findByText("Reading file with AI...");

    view.rerender(<ExpenseImport open={false} onOpenChange={() => {}} />);
    await waitFor(() => expect(aborted).toBe(true));
    await delay(400);
    view.rerender(<ExpenseImport open={true} onOpenChange={() => {}} />);

    expect(screen.getByText("Import expenses")).toBeInTheDocument();
    expect(screen.queryByText("Review import")).not.toBeInTheDocument();
  });
});
