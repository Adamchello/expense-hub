import {
  $addExpenseIntent,
  closeAddExpense,
  openAddExpense,
} from "../core/intent";

beforeEach(() => closeAddExpense());

describe("add-expense intent", () => {
  it("starts closed on the single tab", () => {
    expect($addExpenseIntent.get()).toEqual({
      open: false,
      tab: "single",
      date: null,
    });
  });

  it("opens on the requested tab with a seeded date", () => {
    openAddExpense({ tab: "import" });
    expect($addExpenseIntent.get()).toEqual({
      open: true,
      tab: "import",
      date: null,
    });

    openAddExpense({ date: "2026-09-14" });
    expect($addExpenseIntent.get()).toEqual({
      open: true,
      tab: "single",
      date: "2026-09-14",
    });
  });

  it("forgets the tab and date on close", () => {
    openAddExpense({ tab: "import", date: "2026-09-14" });
    closeAddExpense();
    expect($addExpenseIntent.get()).toEqual({
      open: false,
      tab: "single",
      date: null,
    });
  });
});
