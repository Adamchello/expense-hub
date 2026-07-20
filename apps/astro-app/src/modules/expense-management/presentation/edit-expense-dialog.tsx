"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Expense } from "../domain/expense";
import { useUpdateExpense } from "../core/store";
import { ExpenseFormBody, type ExpenseSubmitData } from "./expense-entry-form";

interface EditExpenseDialogProps {
  expense: Expense | null;
  onOpenChange: (open: boolean) => void;
}

export function EditExpenseDialog({
  expense,
  onOpenChange,
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
        />
      </DialogContent>
    </Dialog>
  );
}
