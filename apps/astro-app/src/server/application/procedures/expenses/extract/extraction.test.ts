import type { LlmJsonRequest } from "@/server/application/core/llm-client";
import { buildExtractionOutputSchema, extractExpensesWith } from "./extraction";

const llm = vi.hoisted(() => ({
  generateJson: vi.fn<(request: LlmJsonRequest) => Promise<unknown>>(),
}));

vi.mock("@/server/application/adapter/llm", () => ({
  generateJson: llm.generateJson,
}));

const CATEGORIES = ["Rent", "Groceries", "Karma", "Uncategorized"];

const validReply = {
  rows: [
    {
      amount: 12.5,
      date: "2024-03-01",
      providerName: "Netflix",
      description: null,
      category: "Uncategorized",
    },
  ],
  warnings: ["one warning"],
};

beforeEach(() => {
  llm.generateJson.mockReset();
  llm.generateJson.mockResolvedValue(validReply);
});

const lastRequest = () => llm.generateJson.mock.calls[0][0];

describe("extractExpensesWith", () => {
  it("sends a PDF source as a pdf content part plus an instruction", async () => {
    await extractExpensesWith(
      { kind: "pdf", fileName: "statement.pdf", base64: "QUJD" },
      CATEGORIES,
    );

    expect(llm.generateJson).toHaveBeenCalledTimes(1);
    expect(lastRequest().instructions).toMatch(/expense/i);
    expect(lastRequest().content).toEqual([
      { kind: "pdf", fileName: "statement.pdf", base64: "QUJD" },
      { kind: "text", text: expect.stringMatching(/extract/i) },
    ]);
  });

  it("sends spreadsheet rows as a single text part carrying headers and rows", async () => {
    await extractExpensesWith(
      {
        kind: "rows",
        fileName: "bank.csv",
        headers: ["Data", "Kwota"],
        rows: [["2024-03-01", "12,50"]],
      },
      CATEGORIES,
    );

    const content = lastRequest().content;
    expect(content).toHaveLength(1);
    const part = content[0];
    expect(part.kind).toBe("text");
    if (part.kind === "text") {
      expect(part.text).toContain("bank.csv");
      expect(part.text).toContain('"Kwota"');
      expect(part.text).toContain('"12,50"');
    }
  });

  it("lists the user's categories in the instructions", async () => {
    await extractExpensesWith(
      { kind: "pdf", fileName: "a.pdf", base64: "QUJD" },
      CATEGORIES,
    );

    expect(lastRequest().instructions).toContain("Karma");
    expect(lastRequest().instructions).toContain("Groceries");
  });

  it("constrains the category field to the user's categories in the output schema", async () => {
    await extractExpensesWith(
      { kind: "pdf", fileName: "a.pdf", base64: "QUJD" },
      CATEGORIES,
    );

    const schema = lastRequest().output.schema as any;
    expect(lastRequest().output.name).toBe("expense_extraction");
    expect(schema.properties.rows.items.properties.category).toEqual({
      type: "string",
      enum: CATEGORIES,
    });
  });

  it("returns the validated result", async () => {
    await expect(
      extractExpensesWith(
        { kind: "pdf", fileName: "a.pdf", base64: "QUJD" },
        CATEGORIES,
      ),
    ).resolves.toEqual(validReply);
  });

  it("rejects a reply that does not match the schema", async () => {
    llm.generateJson.mockResolvedValue({ nope: true });

    await expect(
      extractExpensesWith(
        { kind: "pdf", fileName: "a.pdf", base64: "QUJD" },
        CATEGORIES,
      ),
    ).rejects.toThrow();
  });
});

describe("buildExtractionOutputSchema", () => {
  it("is derived from the contract in strict-mode shape", () => {
    const schema = buildExtractionOutputSchema(CATEGORIES) as any;

    expect(schema.additionalProperties).toBe(false);
    expect(schema.required).toEqual(
      expect.arrayContaining(["rows", "warnings"]),
    );
    const row = schema.properties.rows.items;
    expect(row.additionalProperties).toBe(false);
    expect(row.required).toEqual(
      expect.arrayContaining([
        "amount",
        "date",
        "providerName",
        "description",
        "category",
      ]),
    );
    expect(schema).not.toHaveProperty("$schema");
  });
});
