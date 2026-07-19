"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/ui/skeleton";
import { CardActionsMenu } from "@/components/ui/card-actions-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCategoryOptions } from "@/modules/category-management/core/use-category-options";
import { formatCurrency, formatDate } from "@/shared/format";
import { FREQUENCY_LABELS, daysUntil } from "@/shared/domain/recurrence";
import { cn } from "@/lib/utils";
import type { RecurringBill } from "../domain/recurring-bill";
import {
  useRecurringBills,
  useDeleteRecurringBill,
  useLogRecurringBill,
} from "../core/store";
import { RecurringBillDialog } from "./recurring-bill-dialog";
import { Pencil, Plus, Receipt, Trash2 } from "lucide-react";

export function dueLabel(nextDueDate: string, today: string): string {
  const days = daysUntil(today, nextDueDate);
  if (days < -1) return `overdue by ${-days} days`;
  if (days === -1) return "overdue by 1 day";
  if (days === 0) return "due today";
  if (days === 1) return "due tomorrow";
  if (days <= 7) return `due in ${days} days`;
  return `due ${formatDate(nextDueDate)}`;
}

export function RecurringBills() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringBill | null>(null);
  const [deleting, setDeleting] = useState<RecurringBill | null>(null);

  const query = useRecurringBills();
  const deleteMutation = useDeleteRecurringBill();
  const logMutation = useLogRecurringBill();
  const { washClassFor, textClassFor } = useCategoryOptions();

  const today = new Date().toISOString().slice(0, 10);
  const recurringBills = query.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setIsDialogOpen(true);
  };

  const openEdit = (bill: RecurringBill) => {
    setEditing(bill);
    setIsDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleting) return;
    deleteMutation.mutate(deleting.id, {
      onSuccess: () => setDeleting(null),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          New Recurring Bill
        </Button>
      </div>

      {query.error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">
            {query.error instanceof Error
              ? query.error.message
              : "Failed to load recurring bills"}
          </p>
        </div>
      )}

      {query.isLoading ? (
        <SkeletonList rows={3} />
      ) : recurringBills.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No recurring bills yet. Create one for rent, subscriptions, or any
            bill that repeats.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recurringBills.map((bill) => {
            const days = daysUntil(today, bill.next_due_date);
            const isDue = days <= 0;
            return (
              <div
                key={bill.id}
                className={cn(
                  "group rounded-lg border p-3 transition-opacity hover:opacity-90",
                  washClassFor(bill.category),
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {bill.provider_name}
                  </h4>
                  <p className="shrink-0 font-mono text-sm font-semibold tracking-tight">
                    {formatCurrency(bill.amount)}
                  </p>
                  <CardActionsMenu
                    label={`Actions for recurring bill ${bill.provider_name}`}
                    actions={[
                      {
                        label: "Edit",
                        icon: Pencil,
                        onClick: () => openEdit(bill),
                      },
                      {
                        label: "Delete",
                        icon: Trash2,
                        destructive: true,
                        onClick: () => setDeleting(bill),
                      },
                    ]}
                  />
                </div>
                <p
                  className={cn(
                    "mt-1 text-[11px] font-semibold",
                    textClassFor(bill.category),
                  )}
                >
                  {bill.category}
                  <span className="font-medium text-muted-foreground">
                    {" "}
                    · {FREQUENCY_LABELS[bill.frequency]}
                  </span>
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-[11px]",
                    isDue
                      ? "font-semibold text-destructive"
                      : "text-muted-foreground",
                  )}
                  data-e2e="recurring-due-label"
                >
                  {dueLabel(bill.next_due_date, today)}
                </p>
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={logMutation.isPending}
                    onClick={() => logMutation.mutate(bill.id)}
                  >
                    <Receipt className="size-3.5" />
                    Log bill
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {logMutation.error && (
        <p className="text-sm text-destructive">
          {logMutation.error instanceof Error
            ? logMutation.error.message
            : "Failed to log bill"}
        </p>
      )}

      <RecurringBillDialog
        open={isDialogOpen}
        editing={editing}
        onOpenChange={setIsDialogOpen}
      />

      {/* Delete confirmation */}
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete recurring bill?</DialogTitle>
          </DialogHeader>
          {deleting && (
            <p className="text-sm text-muted-foreground">
              This will stop tracking{" "}
              <span className="font-medium text-foreground">
                {deleting.provider_name}
              </span>{" "}
              ({FREQUENCY_LABELS[deleting.frequency].toLowerCase()},{" "}
              {formatCurrency(deleting.amount)}). Already-logged bills stay in
              your history.
            </p>
          )}
          {deleteMutation.error && (
            <p className="text-sm text-destructive">
              {deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : "Failed to delete recurring bill"}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setDeleting(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
