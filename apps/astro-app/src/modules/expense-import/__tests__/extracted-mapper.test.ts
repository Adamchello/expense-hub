import { rowsFromExtracted } from "../core/file-import/extracted-mapper";

describe("rowsFromExtracted", () => {
  it("keeps the model's ISO date, category, and stringifies the amount", () => {
    const [row] = rowsFromExtracted([
      {
        amount: 12.5,
        date: "2024-03-01",
        providerName: "Netflix",
        description: null,
        category: "Streaming",
      },
    ]);

    expect(row).toMatchObject({
      amount: "12.5",
      date: "2024-03-01",
      providerName: "Netflix",
      description: "",
      category: "Streaming",
      errors: [],
    });
  });

  it("flags a row whose date the model got wrong", () => {
    const [row] = rowsFromExtracted([
      {
        amount: 5,
        date: "not-a-date",
        providerName: "Shop",
        description: "x",
        category: "Uncategorized",
      },
    ]);

    expect(row.errors).toContain("Invalid date format");
  });

  it("flags a non-positive amount", () => {
    const [row] = rowsFromExtracted([
      {
        amount: 0,
        date: "2024-03-01",
        providerName: "Shop",
        description: null,
        category: "Uncategorized",
      },
    ]);

    expect(row.errors).toContain("Amount must be a positive number");
  });
});
