"use client";

import { CardActionsMenu } from "@/components/ui/card-actions-menu";
import { useCategoryOptions } from "@/modules/category-management/core/use-category-options";
import { formatCurrency, formatDate } from "@/shared/format";
import { FREQUENCY_LABELS } from "@/shared/domain/recurrence";
import { cn } from "@/lib/utils";
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
  const { washClassFor, textClassFor } = useCategoryOptions();

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {recurringPayments.map((expense) => (
        <div
          key={expense.id}
          className={cn(
            "group rounded-lg border p-3 transition-opacity hover:opacity-90",
            washClassFor(expense.category),
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="min-w-0 flex-1 truncate text-sm font-semibold">
              {expense.provider_name}
            </h4>
            <p className="shrink-0 font-mono text-sm font-semibold tracking-tight">
              {formatCurrency(expense.amount)}
            </p>
            <CardActionsMenu
              label={`Actions for recurring payment ${expense.provider_name}`}
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
          </div>
          <p
            className={cn(
              "mt-1 text-[11px] font-semibold",
              textClassFor(expense.category),
            )}
          >
            {expense.category}
            <span className="font-medium text-muted-foreground">
              {" "}
              · {FREQUENCY_LABELS[expense.frequency]}
            </span>
          </p>
          <p
            className="mt-0.5 text-[11px] text-muted-foreground"
            data-e2e="recurring-due-label"
          >
            Next payment {formatDate(expense.next_due_date)}
          </p>
        </div>
      ))}
    </div>
  );
}
