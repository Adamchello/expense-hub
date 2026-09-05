import { parseDate } from "../core/parsers/date";

// Runs under whatever TZ the machine has (CEST locally, UTC in CI). The
// parser must return the calendar day the user wrote, never a UTC-shifted one.
describe("parseDate", () => {
  it("returns an ISO input unchanged regardless of timezone", () => {
    expect(parseDate("2024-03-01").value).toBe("2024-03-01");
  });

  it("normalizes a European DD.MM.YYYY date", () => {
    expect(parseDate("01.03.2024").value).toBe("2024-03-01");
  });

  it("normalizes a US MM/DD/YYYY date", () => {
    expect(parseDate("03/01/2024").value).toBe("2024-03-01");
  });

  it("rejects future dates", () => {
    expect(parseDate("2999-01-01").error).toBe("Date cannot be in the future");
  });

  it("rejects garbage", () => {
    expect(parseDate("not-a-date").error).toBe("Invalid date format");
  });
});
