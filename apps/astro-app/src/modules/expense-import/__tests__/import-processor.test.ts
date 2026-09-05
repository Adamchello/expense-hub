import { categorizeRows, checkDuplicates } from "../core/import-processor";
import type { ParsedExpenseRow } from "../domain/expense-import";
import type { Expense } from "@/modules/expense-management/domain/expense";

const row = (overrides: Partial<ParsedExpenseRow> = {}): ParsedExpenseRow => ({
  id: "r1",
  amount: "15.99",
  date: "2024-01-15",
  providerName: "Netflix",
  description: "",
  category: "Uncategorized",
  errors: [],
  isDuplicate: false,
  ...overrides,
});

const existing = (overrides: Partial<Expense> = {}): Expense =>
  ({
    id: "e1",
    amount: 15.99,
    date: "2024-01-15",
    provider_name: "Netflix",
    description: null,
    category: "Streaming",
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  }) as Expense;

describe("categorizeRows", () => {
  it("suggests a category for rows that have none", () => {
    const [result] = categorizeRows([row({ providerName: "Netflix" })]);

    expect(result.category).toBe("Streaming");
  });

  it("keeps a category the source already assigned", () => {
    const [result] = categorizeRows([
      row({ providerName: "Netflix", category: "Entertainment" }),
    ]);

    expect(result.category).toBe("Entertainment");
  });
});

describe("checkDuplicates provider matching", () => {
  it("flags an exact provider match on the same amount and date", () => {
    const [result] = checkDuplicates([row()], [existing()]);

    expect(result.isDuplicate).toBe(true);
  });

  it("flags a model-normalized name that contains the stored one", () => {
    const [result] = checkDuplicates(
      [row({ providerName: "NETFLIX.COM Amsterdam" })],
      [existing({ provider_name: "Netflix" })],
    );

    expect(result.isDuplicate).toBe(true);
  });

  it("flags a stored name that contains the imported one", () => {
    const [result] = checkDuplicates(
      [row({ providerName: "UPC" })],
      [existing({ provider_name: "UPC Polska Internet" })],
    );

    expect(result.isDuplicate).toBe(true);
  });

  it("ignores punctuation and case when comparing", () => {
    const [result] = checkDuplicates(
      [row({ providerName: "pge-obrot" })],
      [existing({ provider_name: "PGE Obrót" })],
    );

    expect(result.isDuplicate).toBe(true);
  });

  it("does not flag a different provider on the same amount and date", () => {
    const [result] = checkDuplicates(
      [row({ providerName: "Spotify" })],
      [existing({ provider_name: "Netflix" })],
    );

    expect(result.isDuplicate).toBe(false);
  });

  it("does not let a very short name match everything", () => {
    const [result] = checkDuplicates(
      [row({ providerName: "AB" })],
      [existing({ provider_name: "Abonament Telewizja" })],
    );

    expect(result.isDuplicate).toBe(false);
  });

  it("does not flag when the amount differs", () => {
    const [result] = checkDuplicates([row({ amount: "19.99" })], [existing()]);

    expect(result.isDuplicate).toBe(false);
  });
});
