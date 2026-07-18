import { describe, expect, it } from "vitest";
import { advanceDueDate, daysUntil } from "@/shared/domain/recurrence";

describe("advanceDueDate", () => {
  it("advances weekly by 7 days", () => {
    expect(advanceDueDate("2026-07-18", "weekly")).toBe("2026-07-25");
  });

  it("advances weekly across a month boundary", () => {
    expect(advanceDueDate("2026-07-28", "weekly")).toBe("2026-08-04");
  });

  it("advances monthly keeping the day", () => {
    expect(advanceDueDate("2026-07-18", "monthly")).toBe("2026-08-18");
  });

  it("clamps monthly to the last day of shorter months", () => {
    expect(advanceDueDate("2026-01-31", "monthly")).toBe("2026-02-28");
    expect(advanceDueDate("2024-01-31", "monthly")).toBe("2024-02-29");
  });

  it("advances quarterly", () => {
    expect(advanceDueDate("2026-11-30", "quarterly")).toBe("2027-02-28");
  });

  it("advances yearly, clamping Feb 29", () => {
    expect(advanceDueDate("2024-02-29", "yearly")).toBe("2025-02-28");
  });
});

describe("daysUntil", () => {
  it("is zero for the same day", () => {
    expect(daysUntil("2026-07-18", "2026-07-18")).toBe(0);
  });

  it("counts forward", () => {
    expect(daysUntil("2026-07-18", "2026-07-19")).toBe(1);
    expect(daysUntil("2026-07-18", "2026-08-18")).toBe(31);
  });

  it("is negative for overdue dates", () => {
    expect(daysUntil("2026-07-18", "2026-07-15")).toBe(-3);
  });
});
