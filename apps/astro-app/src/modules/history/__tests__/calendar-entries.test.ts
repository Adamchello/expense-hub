import type { Expense } from "@/modules/expense-management/domain/expense";
import type { RecurringPayment } from "@/modules/recurring-payments/domain/recurring-payment";
import {
  groupExpensesByDay,
  groupScheduledByDay,
  sumAmounts,
  toCalendarEntries,
} from "../core/calendar-entries";
import { toIncomingRecord } from "../core/incoming-records";

const expense = (overrides: Partial<Expense>): Expense => ({
  id: "e1",
  amount: 10,
  date: "2026-09-03",
  provider_name: "Lidl",
  description: null,
  category: "Groceries",
  created_at: "2026-09-03T10:00:00.000Z",
  ...overrides,
});

const payment = (overrides: Partial<RecurringPayment>): RecurringPayment => ({
  id: "r1",
  amount: 15,
  provider_name: "Netflix",
  description: null,
  category: "Entertainment",
  frequency: "monthly",
  next_due_date: "2026-09-20",
  created_at: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("groupExpensesByDay", () => {
  it("keeps only the month asked for, grouped by date", () => {
    const byDay = groupExpensesByDay(
      [
        expense({ id: "a", date: "2026-09-03" }),
        expense({ id: "b", date: "2026-09-03" }),
        expense({ id: "c", date: "2026-08-31" }),
      ],
      "2026-09",
    );
    expect([...byDay.keys()]).toEqual(["2026-09-03"]);
    expect(byDay.get("2026-09-03")?.map((e) => e.id)).toEqual(["a", "b"]);
  });
});

describe("groupScheduledByDay", () => {
  it("unrolls a monthly payment onto its due day inside the month", () => {
    const byDay = groupScheduledByDay([payment({})], "2026-09");
    expect([...byDay.keys()]).toEqual(["2026-09-20"]);
  });

  it("carries nothing for a month before the next due date", () => {
    const byDay = groupScheduledByDay([payment({})], "2026-08");
    expect(byDay.size).toBe(0);
  });
});

describe("toCalendarEntries", () => {
  it("merges logged and scheduled entries on the same day, coloured by category", () => {
    const expensesByDay = new Map([["2026-09-20", [expense({ id: "a" })]]]);
    const scheduledByDay = new Map([["2026-09-20", [payment({})]]]);
    const colorFor = (category: string) =>
      category === "Groceries" ? "#0f0" : "#f00";

    const entries = toCalendarEntries(expensesByDay, scheduledByDay, colorFor);

    expect(entries.get("2026-09-20")).toEqual([
      {
        id: "expense-a",
        label: "Lidl",
        amount: 10,
        tone: "logged",
        color: "#0f0",
      },
      {
        id: "recurring-r1",
        label: "Netflix",
        amount: 15,
        tone: "scheduled",
        color: "#f00",
      },
    ]);
  });
});

describe("sumAmounts", () => {
  it("totals every item across every day", () => {
    const byDay = new Map([
      ["2026-09-01", [{ amount: 1 }, { amount: 2 }]],
      ["2026-09-02", [{ amount: 3.5 }]],
    ]);
    expect(sumAmounts(byDay)).toBe(6.5);
  });
});

describe("toIncomingRecord", () => {
  it("presents a recurring payment as a history record", () => {
    const onOpen = vi.fn();
    const record = toIncomingRecord(payment({}), onOpen);

    expect(record).toMatchObject({
      id: "r1",
      name: "Netflix",
      amount: 15,
      category: "Entertainment",
      date: "2026-09-20",
      categorySuffix: "· Monthly",
      openLabel: "Edit recurring payment Netflix",
    });
    expect(record.meta).toMatch(/^Next payment /);

    record.onOpen();
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: "r1" }));
  });
});
