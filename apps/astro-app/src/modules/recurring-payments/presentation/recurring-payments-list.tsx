"use client";

import { RecordCard } from "@/components/shared";
import { formatDate } from "@/shared/format";
import { FREQUENCY_LABELS } from "@/shared/domain/recurrence";
import type { RecurringPayment } from "../domain/recurring-payment";
import { Pencil, Trash2 } from "lucide-react";

interface RecurringPaymentsListProps {
  recurringPayments: RecurringPayment[];
  onEdit: (expense: RecurringPayment) => void;
  onDelete: (expense: RecurringPayment) => void;
}

/** Grid view: every recurring payment as a card, actions in the ⋯ menu. */
export function RecurringPaymentsList({
  recurringPayments,
  onEdit,
  onDelete,
}: RecurringPaymentsListProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {recurringPayments.map((expense) => (
        <RecordCard
          key={expense.id}
          name={expense.provider_name}
          amount={expense.amount}
          category={expense.category}
          categorySuffix={`· ${FREQUENCY_LABELS[expense.frequency]}`}
          meta={`Next payment ${formatDate(expense.next_due_date)}`}
          metaTestId="recurring-due-label"
          actionsLabel={`Actions for recurring payment ${expense.provider_name}`}
          actions={[
            {
              label: "Edit",
              icon: Pencil,
              onClick: () => onEdit(expense),
            },
            {
              label: "Delete",
              icon: Trash2,
              destructive: true,
              onClick: () => onDelete(expense),
            },
          ]}
        />
      ))}
    </div>
  );
}
