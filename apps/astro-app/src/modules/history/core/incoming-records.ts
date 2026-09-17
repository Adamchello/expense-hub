import type { RecurringPayment } from "@/modules/recurring-payments/domain/recurring-payment";
import type { IncomingRecord } from "@/shared/records/incoming-record";
import { formatDate } from "@/shared/calendar/format";
import { FREQUENCY_LABELS } from "@/shared/recurring/frequency";

/**
 * A recurring payment as the history register shows it: the Incoming group at
 * the head of the list, under the same search, filters and sort as the
 * charges it has already made.
 */
export function toIncomingRecord(
  payment: RecurringPayment,
  onOpen: (payment: RecurringPayment) => void,
): IncomingRecord {
  return {
    id: payment.id,
    name: payment.provider_name,
    amount: payment.amount,
    category: payment.category,
    description: payment.description,
    date: payment.next_due_date,
    categorySuffix: `· ${FREQUENCY_LABELS[payment.frequency]}`,
    meta: `Next payment ${formatDate(payment.next_due_date)}`,
    metaTestId: "recurring-due-label",
    openLabel: `Edit recurring payment ${payment.provider_name}`,
    onOpen: () => onOpen(payment),
  };
}
