import { describe, expect, it } from "vitest";
import { formatAmountInput, toCanonicalAmount } from "../amount-input";

const typed = (raw: string) => formatAmountInput(toCanonicalAmount(raw));

describe("toCanonicalAmount", () => {
  it("reads a comma before two digits as the decimal separator", () => {
    expect(toCanonicalAmount("332342,12")).toBe("332342.12");
  });

  it("reads a comma before three digits as a thousands group", () => {
    expect(toCanonicalAmount("1,234")).toBe("1234");
  });

  it("round-trips its own grouped output", () => {
    expect(toCanonicalAmount("332,342.12")).toBe("332342.12");
  });

  it("truncates cents past two digits", () => {
    expect(toCanonicalAmount("12.3456")).toBe("12.34");
  });

  it("reads a comma trailed by more digits than cents allow as grouping", () => {
    // The state a half-typed "33,234" passes through on its way to "332,342".
    expect(toCanonicalAmount("3,3234")).toBe("33234");
  });

  it("drops currency glyphs and spaces from a pasted amount", () => {
    expect(toCanonicalAmount("$ 1,284.60")).toBe("1284.60");
  });

  it("keeps a trailing separator so cents can still be typed", () => {
    expect(toCanonicalAmount("332342.")).toBe("332342.");
  });

  it("supplies the leading zero when cents are typed first", () => {
    expect(toCanonicalAmount(".5")).toBe("0.5");
  });

  it("strips leading zeros without eating a lone zero", () => {
    expect(toCanonicalAmount("0050")).toBe("50");
    expect(toCanonicalAmount("0")).toBe("0");
  });

  it("keeps a leading minus so the form can reject it", () => {
    expect(toCanonicalAmount("-100")).toBe("-100");
  });

  it("returns empty for a cleared field", () => {
    expect(toCanonicalAmount("")).toBe("");
    expect(toCanonicalAmount("abc")).toBe("");
  });
});

describe("formatAmountInput", () => {
  it("groups thousands and leaves cents alone", () => {
    expect(formatAmountInput("332342.12")).toBe("332,342.12");
    expect(formatAmountInput("1000000")).toBe("1,000,000");
  });

  it("does not group a value under a thousand", () => {
    expect(formatAmountInput("150.5")).toBe("150.5");
  });

  it("groups a negative value without breaking the sign", () => {
    expect(formatAmountInput("-332342.12")).toBe("-332,342.12");
  });
});

describe("typing into a money field", () => {
  it("renders both separator conventions the same way", () => {
    expect(typed("332342,12")).toBe("332,342.12");
    expect(typed("332342.12")).toBe("332,342.12");
  });

  it("never shows more than two cent digits", () => {
    expect(typed("332342.1299")).toBe("332,342.12");
  });

  it("regroups its own output when a digit lands mid-number", () => {
    expect(typed("3,3234")).toBe("33,234");
  });

  it("keeps the value parseable by the form", () => {
    expect(parseFloat(toCanonicalAmount("332342,12"))).toBe(332342.12);
  });
});
