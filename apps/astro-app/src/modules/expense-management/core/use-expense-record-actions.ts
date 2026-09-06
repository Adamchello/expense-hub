"use client";

import { useState } from "react";
import { queryClient } from "@/libs/api/query-client";
import { toast } from "@/libs/ui/toast";
import type { Expense } from "../domain/expense";
import { createExpense } from "../integration/repository";
import { EXPENSES_KEY, useDeleteExpense } from "./store";

/**
 * The edit / delete choreography for a logged expense.
 *
 * Every surface that shows an expense card (the history register, the
 * calendar day panel) needs the same rules: one dialog at a time, delete is
 * always reached through a confirmation, and a confirmed delete can be undone
 * from the toast. Holding that here means each surface renders
 * `ExpenseRecordDialogs` and forgets about it.
 */
export function useExpenseRecordActions() {
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);

  const deleteMutation = useDeleteExpense();

  const openEdit = (expense: Expense) => {
    setDeleting(null);
    setEditing(expense);
  };

  // Delete arrives from the edit dialog, so close it first: only one dialog is
  // ever open.
  const openDelete = (expense: Expense) => {
    setEditing(null);
    setDeleting(expense);
  };

  // Undo re-creates the deleted expense from its client-side snapshot.
  const restore = async (removed: Expense) => {
    try {
      await createExpense({
        amount: removed.amount,
        date: removed.date,
        providerName: removed.provider_name,
        description: removed.description,
        category: removed.category,
      });
      toast("Expense restored");
    } catch {
      toast("Failed to restore expense", { variant: "error" });
    } finally {
      queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
    }
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const removed = deleting;
    deleteMutation.mutate(removed.id, {
      onSuccess: () => {
        setDeleting(null);
        toast(`Deleted ${removed.provider_name} expense`, {
          undo: () => restore(removed),
        });
      },
    });
  };

  return {
    editing,
    setEditing,
    deleting,
    setDeleting,
    openEdit,
    openDelete,
    confirmDelete,
    deleteMutation,
  };
}

export type ExpenseRecordActions = ReturnType<typeof useExpenseRecordActions>;
