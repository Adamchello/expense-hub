import { describe, expect, it } from "vitest";
import type {
  RecurringBill,
  RecurringBillEvent,
} from "@/modules/recurring-bills/domain/recurring-bill";
import { buildMonthlyChecklist } from "../core/checklist";

let id = 0;
const recurring = (
  provider: string,
  frequency: RecurringBill["frequency"],
  nextDueDate: string,
  amount = 10,
): RecurringBill => ({
  id: `r${++id}`,
  amount,
  provider_name: provider,
  description: null,
  category: "Uncategorized",
  frequency,
  next_due_date: nextDueDate,
  created_at: "2026-01-01T00:00:00Z",
});

const event = (
  recurringId: string,
  dueDate: string,
  status: "paid" | "skipped",
): RecurringBillEvent => ({
  id: `e${++id}`,
  recurring_id: recurringId,
  due_date: dueDate,
  status,
  bill_id: status === "paid" ? "b1" : null,
  created_at: `${dueDate}T00:00:00Z`,
});

describe("buildMonthlyChecklist", () => {
  it("derives upcoming vs overdue from today", () => {
    const bills = [
      recurring("Rent", "monthly", "2026-07-05"),
      recurring("Netflix", "monthly", "2026-07-25"),
    ];
    const items = buildMonthlyChecklist(bills, [], "2026-07", "2026-07-18");
    expect(items.map((i) => [i.provider, i.status])).toEqual([
      ["Rent", "overdue"],
      ["Netflix", "upcoming"],
    ]);
  });

  it("shows settled events as paid or skipped and hides them from open items", () => {
    const rent = recurring("Rent", "monthly", "2026-08-05"); // already advanced
    const items = buildMonthlyChecklist(
      [rent],
      [event(rent.id, "2026-07-05", "paid")],
      "2026-07",
      "2026-07-18",
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      provider: "Rent",
      dueDate: "2026-07-05",
      status: "paid",
      actionable: false,
    });
  });

  it("marks only the current next due occurrence actionable", () => {
    const cleaner = recurring("Cleaner", "weekly", "2026-07-20");
    const items = buildMonthlyChecklist([cleaner], [], "2026-07", "2026-07-18");
    expect(items.map((i) => [i.dueDate, i.actionable])).toEqual([
      ["2026-07-20", true],
      ["2026-07-27", false],
    ]);
  });

  it("keeps skipped occurrences in the list", () => {
    const gym = recurring("Gym", "weekly", "2026-07-26");
    const items = buildMonthlyChecklist(
      [gym],
      [event(gym.id, "2026-07-19", "skipped")],
      "2026-07",
      "2026-07-18",
    );
    expect(items.map((i) => [i.dueDate, i.status])).toEqual([
      ["2026-07-19", "skipped"],
      ["2026-07-26", "upcoming"],
    ]);
  });

  it("ignores events whose recurring bill was deleted", () => {
    const items = buildMonthlyChecklist(
      [],
      [event("ghost", "2026-07-10", "paid")],
      "2026-07",
      "2026-07-18",
    );
    expect(items).toEqual([]);
  });
});
