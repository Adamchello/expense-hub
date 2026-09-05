import {
  buildContext,
  buildSupabaseMock,
  type SupabaseMockConfig,
} from "@/server/__tests__/supabase-mock";
import type { LlmJsonRequest } from "@/server/application/core/llm-client";
import {
  EXTRACT_DAILY_LIMIT,
  EXTRACT_PDF_BASE64_MAX_LENGTH,
} from "@/shared/server-contracts/schemas/expense";
import { extractExpenses } from "./index";

const mock = vi.hoisted(() => ({
  db: undefined as unknown,
  generateJson: vi.fn<(request: LlmJsonRequest) => Promise<unknown>>(),
}));

vi.mock("@/shared/data-sources/supabase-server", () => ({
  createSupabaseServerClient: () => mock.db,
}));

vi.mock("@/server/application/adapter/llm", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/server/application/adapter/llm")
  >()),
  generateJson: mock.generateJson,
}));

const user = { id: "user-1", email: "e2e@test.com" };

const validReply = {
  rows: [
    {
      amount: 12.5,
      date: "2024-03-01",
      providerName: "Netflix",
      description: null,
      category: "Streaming",
    },
  ],
  warnings: ["one warning"],
};

/** Signed-in user with an active profile, quota available, no custom categories. */
const happyDb = (overrides: Partial<SupabaseMockConfig> = {}) =>
  buildSupabaseMock({
    user,
    tables: {
      account_settings: { data: { active_profile_id: "profile-1" } },
      custom_categories: { data: [] },
      ...overrides.tables,
    },
    rpc: overrides.rpc ?? { consume_extraction_quota: { data: 1 } },
  });

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  mock.generateJson.mockReset();
  mock.generateJson.mockResolvedValue(validReply);
});

const pdfInput = { kind: "pdf", fileName: "statement.pdf", base64: "QUJD" };

describe("extractExpenses procedure", () => {
  it("returns the extracted rows and warnings for a PDF", async () => {
    mock.db = happyDb();

    const result = await extractExpenses(pdfInput, buildContext());

    expect(mock.generateJson).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ code: 200, ...validReply });
  });

  it("accepts spreadsheet rows", async () => {
    mock.db = happyDb();

    const result = await extractExpenses(
      {
        kind: "rows",
        fileName: "bank.csv",
        headers: ["Data", "Kwota"],
        rows: [["2024-03-01", "12,50"]],
      },
      buildContext(),
    );

    expect(mock.generateJson).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ code: 200 });
  });

  it("offers built-in and the profile's custom categories to the model", async () => {
    mock.db = happyDb({
      tables: {
        custom_categories: { data: [{ name: "Karma" }, { name: "Dog" }] },
      },
    });

    await extractExpenses(pdfInput, buildContext());

    const schema = mock.generateJson.mock.calls[0][0].output.schema as any;
    const offered: string[] =
      schema.properties.rows.items.properties.category.enum;
    expect(offered).toEqual(
      expect.arrayContaining(["Groceries", "Karma", "Dog"]),
    );
    expect(offered).toContain("Uncategorized");
  });

  it("consumes one unit of the daily quota before calling the model", async () => {
    mock.db = happyDb();

    await extractExpenses(pdfInput, buildContext());

    expect(mock.generateJson).toHaveBeenCalledTimes(1);
  });

  it("returns 429 without calling the model when the daily quota is used up", async () => {
    mock.db = happyDb({ rpc: { consume_extraction_quota: { data: -1 } } });

    const result = await extractExpenses(pdfInput, buildContext());

    expect(result).toMatchObject({ code: 429, type: "too-many-requests" });
    expect((result as { message: string }).message).toMatch(
      new RegExp(String(EXTRACT_DAILY_LIMIT)),
    );
    expect(mock.generateJson).not.toHaveBeenCalled();
  });

  it("returns 500 when the quota check itself fails", async () => {
    mock.db = happyDb({
      rpc: { consume_extraction_quota: { error: { message: "db down" } } },
    });

    const result = await extractExpenses(pdfInput, buildContext());

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
    expect(mock.generateJson).not.toHaveBeenCalled();
  });

  it("returns 401 when there is no authenticated user", async () => {
    mock.db = buildSupabaseMock({ user: null });

    const result = await extractExpenses(pdfInput, buildContext());

    expect(result).toMatchObject({ code: 401, type: "unauthorized" });
    expect(mock.generateJson).not.toHaveBeenCalled();
  });

  it("returns 409 when the account has no active profile", async () => {
    mock.db = buildSupabaseMock({
      user,
      tables: { account_settings: { data: null } },
    });

    const result = await extractExpenses(pdfInput, buildContext());

    expect(result).toMatchObject({ code: 409, type: "conflict" });
    expect(mock.generateJson).not.toHaveBeenCalled();
  });

  it("returns 400 for an unknown source kind", async () => {
    mock.db = happyDb();

    const result = await extractExpenses(
      { kind: "docx", fileName: "a.docx", base64: "QUJD" },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 400, type: "bad-request" });
  });

  it("returns 400 when the rows payload exceeds the row cap", async () => {
    mock.db = happyDb();

    const result = await extractExpenses(
      {
        kind: "rows",
        fileName: "huge.csv",
        headers: ["a"],
        rows: Array.from({ length: 501 }, () => ["x"]),
      },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 400, type: "bad-request" });
  });

  it("returns 400 when the PDF payload exceeds the size cap without calling the model", async () => {
    mock.db = happyDb();

    const result = await extractExpenses(
      {
        kind: "pdf",
        fileName: "huge.pdf",
        base64: "A".repeat(EXTRACT_PDF_BASE64_MAX_LENGTH + 1),
      },
      buildContext(),
    );

    expect(result).toMatchObject({ code: 400, type: "bad-request" });
    expect(mock.generateJson).not.toHaveBeenCalled();
  });

  it("returns 400 telling the user to split the file when the reply was cut short", async () => {
    mock.db = happyDb();
    const { LlmOutputTooLongError } =
      await import("@/server/application/adapter/llm");
    mock.generateJson.mockRejectedValue(new LlmOutputTooLongError());

    const result = await extractExpenses(pdfInput, buildContext());

    expect(result).toMatchObject({ code: 400, type: "bad-request" });
    expect((result as { message: string }).message).toMatch(/split/i);
  });

  it("returns 500 with a distinct message when the model refuses", async () => {
    mock.db = happyDb();
    const { LlmRefusedError } =
      await import("@/server/application/adapter/llm");
    mock.generateJson.mockRejectedValue(new LlmRefusedError("nope"));

    const result = await extractExpenses(pdfInput, buildContext());

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
    expect((result as { message: string }).message).toMatch(/declined/i);
  });

  it("returns 500 when the model call fails", async () => {
    mock.db = happyDb();
    mock.generateJson.mockRejectedValue(new Error("boom"));

    const result = await extractExpenses(pdfInput, buildContext());

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
  });

  it("returns 500 when the model reply does not match the schema", async () => {
    mock.db = happyDb();
    mock.generateJson.mockResolvedValue({ nope: true });

    const result = await extractExpenses(pdfInput, buildContext());

    expect(result).toMatchObject({ code: 500, type: "internal-server" });
  });
});
