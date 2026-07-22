"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CategoryBadge,
  DataList,
  EmptyState,
  ListRow,
  ListTotal,
} from "@/components/shared";
import { formatDate } from "@/shared/format";
import { FREQUENCY_LABELS } from "@/shared/domain/recurrence";
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
          <EmptyState variant="inline" description="Nothing due on this day." />
        ) : (
          <>
            <DataList className="max-h-80 overflow-y-auto">
              {occurrences.map(({ recurring }) => (
                <ListRow
                  key={recurring.id}
                  name={recurring.provider_name}
                  secondary={
                    <CategoryBadge
                      category={recurring.category}
                      suffix={`· ${FREQUENCY_LABELS[recurring.frequency]}`}
                    />
                  }
                  amount={recurring.amount}
                  trailing={
                    <>
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
                    </>
                  }
                />
              ))}
            </DataList>
            <ListTotal label="Day total" value={total} />
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
