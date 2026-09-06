import { atom } from "nanostores";
import { useStore } from "@nanostores/react";

export type AddExpenseTab = "single" | "import";

export interface AddExpenseIntent {
  open: boolean;
  /** Tab the dialog opens on. */
  tab: AddExpenseTab;
  /** Seeds the expense date — set when entry started from a calendar day. */
  date: string | null;
}

const CLOSED: AddExpenseIntent = { open: false, tab: "single", date: null };

/**
 * "Open the add-expense dialog" is asked for from five places — the sidebar,
 * the thumb bar, the dashboard's empty state, a calendar day, the history
 * register. None of them should have to be handed a callback down three
 * components to say so. They dispatch here; the dialog, mounted once in the
 * shell, listens.
 */
export const $addExpenseIntent = atom<AddExpenseIntent>(CLOSED);

export const openAddExpense = (
  options: { tab?: AddExpenseTab; date?: string | null } = {},
) => {
  $addExpenseIntent.set({
    open: true,
    tab: options.tab ?? "single",
    date: options.date ?? null,
  });
};

export const closeAddExpense = () => {
  $addExpenseIntent.set(CLOSED);
};

export const useAddExpenseIntent = () => useStore($addExpenseIntent);
