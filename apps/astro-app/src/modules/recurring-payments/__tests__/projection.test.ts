import { describe, expect, it } from "vitest";
import type { RecurringPayment } from "@/modules/recurring-payments/domain/recurring-payment";
import {
  addDays,
  expectedTotal,
  monthBounds,
  projectOccurrences,
  shiftMonth,
} from "../core/projection";

let id = 0;
const recurring = (
  provider: string,
  amount: number,
  frequency: RecurringPayment["frequency"],
  nextDueDate: string,
): RecurringPayment => ({
  id: String(++id),
  amount,
  provider_name: provider,
  description: null,
  category: "Uncategorized",
  frequency,
  next_due_date: nextDueDate,
  created_at: "2026-01-01T00:00:00Z",
});

describe("projectOccurrences", () => {
  it("unrolls a weekly expense across the window", () => {
    const result = projectOccurrences(
      [recurring("Cleaner", 25, "weekly", "2026-08-03")],
      "2026-08-01",
      "2026-08-31",
    );
    expect(result.map((o) => o.date)).toEqual([
      "2026-08-03",
      "2026-08-10",
      "2026-08-17",
      "2026-08-24",
      "2026-08-31",
    ]);
  });

  it("includes a monthly expense once and sorts by date", () => {
    const result = projectOccurrences(
      [
        recurring("Rent", 1000, "monthly", "2026-08-05"),
        recurring("Netflix", 16, "monthly", "2026-08-03"),
      ],
      "2026-08-01",
      "2026-08-31",
    );
    expect(result.map((o) => o.recurring.provider_name)).toEqual([
      "Netflix",
      "Rent",
    ]);
  });

  it("rolls expenses due before the window forward into it", () => {
    const result = projectOccurrences(
      [recurring("Gym", 30, "monthly", "2026-06-15")],
      "2026-08-01",
      "2026-08-31",
    );
    expect(result.map((o) => o.date)).toEqual(["2026-08-15"]);
  });

  it("excludes expenses whose schedule never reaches the window", () => {
    const result = projectOccurrences(
      [recurring("Insurance", 90, "yearly", "2026-12-01")],
      "2026-08-01",
      "2026-08-31",
    );
    expect(result).toEqual([]);
  });
});

describe("expectedTotal", () => {
  it("sums occurrence amounts", () => {
    const occurrences = projectOccurrences(
      [
        recurring("Rent", 1000, "monthly", "2026-08-05"),
        recurring("Cleaner", 25, "weekly", "2026-08-03"),
      ],
      "2026-08-01",
      "2026-08-31",
    );
    expect(expectedTotal(occurrences)).toBe(1125);
  });
});

describe("month helpers", () => {
  it("computes month bounds incl. leap February", () => {
    expect(monthBounds("2026-08")).toEqual({
      from: "2026-08-01",
      to: "2026-08-31",
    });
    expect(monthBounds("2024-02").to).toBe("2024-02-29");
  });

  it("shifts months across year boundaries", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });

  it("adds days across month boundaries", () => {
    expect(addDays("2026-08-30", 3)).toBe("2026-09-02");
  });
});
