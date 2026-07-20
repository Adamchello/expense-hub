"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCategoryOptions } from "@/modules/category-management/core/use-category-options";
import { formatCurrency, formatDate } from "@/shared/format";
import { FREQUENCY_LABELS } from "@/shared/domain/recurrence";
import { cn } from "@/lib/utils";
import type { RecurringPayment } from "../domain/recurring-payment";
import { expectedTotal, projectOccurrences } from "../core/projection";
import { Pencil, Plus, Trash2 } from "lucide-react";

interface DayPaymentsDialogProps {
  /** YYYY-MM-DD of the opened day, or null when closed. */
  date: string | null;
  recurringPayments: RecurringPayment[];
  onOpenChange: (open: boolean) => void;
  onEdit: (expense: RecurringPayment) => void;
  onDelete: (expense: RecurringPayment) => void;
  onAdd: (date: string) => void;
}

/**
 * Everything due on one day, with the same actions the grid offers. Day
 * cells only fit three chips — this is where the rest of a busy day lives.
 */
export function DayPaymentsDialog({
  date,
  recurringPayments,
  onOpenChange,
  onEdit,
  onDelete,
  onAdd,
}: DayPaymentsDialogProps) {
  const { textClassFor } = useCategoryOptions();

  const occurrences = date
    ? projectOccurrences(recurringPayments, date, date)
    : [];
  const total = expectedTotal(occurrences);

  return (
    <Dialog open={date !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{date ? formatDate(date) : ""}</DialogTitle>
        </DialogHeader>

        {occurrences.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nothing due on this day.
          </p>
        ) : (
          <>
            <ul className="flex max-h-80 flex-col divide-y divide-border overflow-y-auto">
              {occurrences.map(({ recurring }) => (
                <li
                  key={recurring.id}
                  className="flex items-center gap-2 py-2.5 first:pt-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {recurring.provider_name}
                    </p>
                    <p
                      className={cn(
                        "text-[11px] font-semibold",
                        textClassFor(recurring.category),
                      )}
                    >
                      {recurring.category}
                      <span className="font-medium text-muted-foreground">
                        {" "}
                        · {FREQUENCY_LABELS[recurring.frequency]}
                      </span>
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-sm font-semibold tracking-tight">
                    {formatCurrency(recurring.amount)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${recurring.provider_name}`}
                    onClick={() => onEdit(recurring)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${recurring.provider_name}`}
                    onClick={() => onDelete(recurring)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <p className="text-sm text-muted-foreground">Day total</p>
              <p className="font-mono text-sm font-semibold tracking-tight">
                {formatCurrency(total)}
              </p>
            </div>
          </>
        )}

        {date && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onAdd(date)}
          >
            <Plus className="size-4" />
            New payment due this day
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
