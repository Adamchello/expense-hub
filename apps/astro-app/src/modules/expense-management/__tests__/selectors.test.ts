import type { Expense } from "../domain/expense";
import { expensesInMonth, newestFirst } from "../core/selectors";

const expense = (id: string, date: string): Expense => ({
  id,
  amount: 1,
  date,
  provider_name: id,
  description: null,
  category: "Groceries",
  created_at: `${date}T10:00:00.000Z`,
});

describe("expensesInMonth", () => {
  it("keeps only the given month", () => {
    const result = expensesInMonth(
      [expense("a", "2026-09-30"), expense("b", "2026-10-01")],
      "2026-09",
    );
    expect(result.map((e) => e.id)).toEqual(["a"]);
  });
});

describe("newestFirst", () => {
  it("sorts by date descending without mutating the input", () => {
    const input = [expense("old", "2026-09-01"), expense("new", "2026-09-20")];
    const result = newestFirst(input);
    expect(result.map((e) => e.id)).toEqual(["new", "old"]);
    expect(input.map((e) => e.id)).toEqual(["old", "new"]);
  });
});
