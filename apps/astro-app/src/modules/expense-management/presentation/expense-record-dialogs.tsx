"use client";

import { ConfirmDialog } from "@/libs/ui/confirm-dialog";
import { Amount } from "@/shared/money/amount";
import type { ExpenseRecordActions } from "../core/use-expense-record-actions";
import { EditExpenseDialog } from "./edit-expense-dialog";

/**
 * The edit form and the delete confirmation, mounted once per surface that can
 * open them. Pair it with `useExpenseRecordActions` — the hook holds the
 * state, this renders it.
 */
export function ExpenseRecordDialogs({
  actions,
}: {
  actions: ExpenseRecordActions;
}) {
  const { deleting } = actions;

  return (
    <>
      <EditExpenseDialog
        expense={actions.editing}
        onOpenChange={(open) => {
          if (!open) actions.setEditing(null);
        }}
        onRequestDelete={actions.openDelete}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) actions.setDeleting(null);
        }}
        title="Delete expense?"
        description={
          deleting && (
            <>
              This will permanently remove the{" "}
              <Amount value={deleting.amount} size="inherit" /> expense from{" "}
              <span className="font-medium text-foreground">
                {deleting.provider_name}
              </span>
              .
            </>
          )
        }
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        onConfirm={actions.confirmDelete}
        isPending={actions.deleteMutation.isPending}
        error={actions.deleteMutation.error}
        errorFallback="Failed to delete expense"
      />
    </>
  );
}
