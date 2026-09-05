import {
  detectColumns,
  hasHeaderRow,
} from "../core/file-import/column-detection";

describe("hasHeaderRow", () => {
  it("recognizes known English column names", () => {
    expect(hasHeaderRow(["amount", "date", "provider"])).toBe(true);
  });

  it("treats a row of plain labels in another language as a header", () => {
    expect(hasHeaderRow(["Data", "Kwota", "Odbiorca"])).toBe(true);
  });

  it("does not treat a row containing a number as a header", () => {
    expect(hasHeaderRow(["2024-03-01", "12,50", "Netflix"])).toBe(false);
  });

  it("does not treat a row containing a date as a header", () => {
    expect(hasHeaderRow(["Netflix", "01.03.2024", "Streaming"])).toBe(false);
  });
});

describe("detectColumns confidence", () => {
  it("is confident when headers name every required column", () => {
    const result = detectColumns(["amount", "date", "provider"], true);

    expect(result.confident).toBe(true);
    expect(result.columns).toMatchObject({ amount: 0, date: 1, provider: 2 });
  });

  it("is not confident when a required column is missing from the headers", () => {
    const result = detectColumns(["Kwota", "Data", "Odbiorca"], true);

    expect(result.confident).toBe(false);
  });

  it("is not confident when the file has no header row", () => {
    const result = detectColumns(["100", "2024-01-01", "Netflix"], false);

    expect(result.confident).toBe(false);
    expect(result.columns).toEqual({
      amount: 0,
      date: 1,
      provider: 2,
      description: 3,
    });
  });

  it("stays confident when only the optional description column is missing", () => {
    const result = detectColumns(["amount", "date", "vendor"], true);

    expect(result.confident).toBe(true);
    expect(result.columns.description).toBe(-1);
  });
});
