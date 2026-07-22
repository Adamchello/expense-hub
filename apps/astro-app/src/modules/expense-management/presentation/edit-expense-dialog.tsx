"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { Expense } from "../domain/expense";
import { useUpdateExpense } from "../core/store";
import { ExpenseFormBody, type ExpenseSubmitData } from "./expense-entry-form";

interface EditExpenseDialogProps {
  expense: Expense | null;
  onOpenChange: (open: boolean) => void;
  /** Hands the record back for deletion; the caller owns confirm + undo. */
  onRequestDelete?: (expense: Expense) => void;
}

export function EditExpenseDialog({
  expense,
  onOpenChange,
  onRequestDelete,
}: EditExpenseDialogProps) {
  const { mutate, error, isPending, reset } = useUpdateExpense();

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleSubmit = (data: ExpenseSubmitData) => {
    if (!expense) return;
    mutate(
      { id: expense.id, formData: data },
      {
        onSuccess: () => handleClose(),
      },
    );
  };

  return (
    <Dialog
      open={!!expense}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>
        <ExpenseFormBody
          key={expense?.id ?? "closed"}
          active={!!expense}
          onCancel={handleClose}
          onSubmit={handleSubmit}
          initialExpense={expense}
          error={error}
          isPending={isPending}
          submitLabel="Save Changes"
          pendingLabel="Saving..."
          errorFallback="Failed to update expense"
          footerAction={
            onRequestDelete &&
            expense && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Delete ${expense.provider_name} expense`}
                disabled={isPending}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onRequestDelete(expense)}
              >
                <Trash2 className="size-4" />
              </Button>
            )
          }
        />
      </DialogContent>
    </Dialog>
  );
}
