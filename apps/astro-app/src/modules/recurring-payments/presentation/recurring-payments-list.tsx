"use client";

import { RecordCard } from "@/components/shared";
import { formatDate } from "@/shared/format";
import { FREQUENCY_LABELS } from "@/shared/domain/recurrence";
import type { RecurringPayment } from "../domain/recurring-payment";

interface RecurringPaymentsListProps {
  recurringPayments: RecurringPayment[];
  onEdit: (expense: RecurringPayment) => void;
}

/** Grid view: every recurring payment as a card. The card is the affordance —
 * clicking it opens the template, and Delete lives inside that dialog. */
export function RecurringPaymentsList({
  recurringPayments,
  onEdit,
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
          onOpen={() => onEdit(expense)}
          openLabel={`Edit recurring payment ${expense.provider_name}`}
        />
      ))}
    </div>
  );
}
