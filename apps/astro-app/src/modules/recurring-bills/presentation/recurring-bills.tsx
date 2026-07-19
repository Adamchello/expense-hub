"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SkeletonList } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCategoryColor } from "@/shared/configuration/category";
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
import { CalendarClock, Pencil, Plus, Receipt, Trash2 } from "lucide-react";

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
        <div className="space-y-2">
          {recurringBills.map((bill) => {
            const days = daysUntil(today, bill.next_due_date);
            const isDue = days <= 0;
            return (
              <Card key={bill.id} className="py-0">
                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <CalendarClock className="size-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate font-medium">
                        {bill.provider_name}
                      </h4>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                          getCategoryColor(bill.category),
                        )}
                      >
                        {bill.category}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {FREQUENCY_LABELS[bill.frequency]}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "mt-0.5 text-xs",
                        isDue
                          ? "font-medium text-destructive"
                          : "text-muted-foreground",
                      )}
                      data-e2e="recurring-due-label"
                    >
                      {dueLabel(bill.next_due_date, today)}
                    </p>
                  </div>
                  <p className="font-mono text-sm font-semibold tracking-tight">
                    {formatCurrency(bill.amount)}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={logMutation.isPending}
                      onClick={() => logMutation.mutate(bill.id)}
                    >
                      <Receipt className="size-3.5" />
                      Log bill
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit recurring bill ${bill.provider_name}`}
                      onClick={() => openEdit(bill)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete recurring bill ${bill.provider_name}`}
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleting(bill)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
