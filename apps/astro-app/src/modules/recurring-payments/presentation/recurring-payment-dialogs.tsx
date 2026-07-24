"use client";

import { ConfirmDialog } from "@/components/shared";
import { formatCurrency } from "@/shared/format";
import { FREQUENCY_LABELS } from "@/shared/domain/recurrence";
import type { RecurringPaymentActions } from "../core/use-recurring-payment-actions";
import { RecurringPaymentDialog } from "./recurring-payment-dialog";

/**
 * The form and the delete confirmation, mounted once per surface that can open
 * them. Pair it with `useRecurringPaymentActions` — the hook holds the state,
 * this renders it.
 */
export function RecurringPaymentDialogs({
  actions,
}: {
  actions: RecurringPaymentActions;
}) {
  const { deleting } = actions;

  return (
    <>
      <RecurringPaymentDialog
        open={actions.isFormOpen}
        editing={actions.editing}
        initialDueDate={actions.createOnDate}
        onOpenChange={actions.setIsFormOpen}
        onRequestDelete={actions.openDelete}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) actions.setDeleting(null);
        }}
        title="Delete recurring payment?"
        description={
          deleting && (
            <>
              This will stop tracking{" "}
              <span className="font-medium text-foreground">
                {deleting.provider_name}
              </span>{" "}
              ({FREQUENCY_LABELS[deleting.frequency].toLowerCase()},{" "}
              {formatCurrency(deleting.amount)}). Already-logged expenses stay
              in your history.
            </>
          )
        }
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        onConfirm={actions.confirmDelete}
        isPending={actions.deleteMutation.isPending}
        error={actions.deleteMutation.error}
        errorFallback="Failed to delete recurring payment"
      />
    </>
  );
}
