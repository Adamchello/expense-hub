"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/shared/format";
import { FREQUENCY_LABELS } from "@/shared/domain/recurrence";
import { cn } from "@/lib/utils";
import type { RecurringPayment } from "../domain/recurring-payment";
import { useRecurringPayments, useDeleteRecurringPayment } from "../core/store";
import { PaymentCalendar } from "./payment-calendar";
import { DayPaymentsDialog } from "./day-payments-dialog";
import { NextMonthSummary } from "./next-month-summary";
import { RecurringPaymentDialog } from "./recurring-payment-dialog";
import { RecurringPaymentsList } from "./recurring-payments-list";
import { CalendarDays, LayoutGrid, Plus } from "lucide-react";

type ViewMode = "grid" | "calendar";

const VIEWS = [
  { value: "grid", label: "Grid", icon: LayoutGrid },
  { value: "calendar", label: "Calendar", icon: CalendarDays },
] as const;

/**
 * Recurring payments in two interchangeable views: the grid answers "what do I
 * pay for", the calendar answers "when does it hit". Both edit and delete —
 * the calendar routes those through its day detail.
 */
export function RecurringPayments() {
  const [view, setView] = useState<ViewMode>("grid");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringPayment | null>(null);
  const [deleting, setDeleting] = useState<RecurringPayment | null>(null);
  const [dayDetail, setDayDetail] = useState<string | null>(null);
  const [createOnDate, setCreateOnDate] = useState<string | null>(null);

  const query = useRecurringPayments();
  const deleteMutation = useDeleteRecurringPayment();

  const recurringPayments = query.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setCreateOnDate(null);
    setIsDialogOpen(true);
  };

  /** Clicking a calendar day starts a payment already due that day. */
  const openCreateOn = (date: string) => {
    setDayDetail(null);
    setEditing(null);
    setCreateOnDate(date);
    setIsDialogOpen(true);
  };

  // Editing or deleting from the day detail replaces it — one dialog at a time.
  const openEdit = (expense: RecurringPayment) => {
    setDayDetail(null);
    setEditing(expense);
    setIsDialogOpen(true);
  };

  const openDelete = (expense: RecurringPayment) => {
    setDayDetail(null);
    setDeleting(expense);
  };

  const handleConfirmDelete = () => {
    if (!deleting) return;
    deleteMutation.mutate(deleting.id, {
      onSuccess: () => setDeleting(null),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="tablist"
          aria-label="Recurring payments view"
          className="inline-flex rounded-lg border border-border bg-card p-0.5"
        >
          {VIEWS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={view === option.value}
              onClick={() => setView(option.value)}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                view === option.value
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <option.icon className="size-4" />
              {option.label}
            </button>
          ))}
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          New Recurring Payment
        </Button>
      </div>

      {query.error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">
            {query.error instanceof Error
              ? query.error.message
              : "Failed to load recurring payments"}
          </p>
        </div>
      )}

      {query.isLoading ? (
        <SkeletonList rows={3} />
      ) : recurringPayments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No recurring payments yet. Create one for rent, subscriptions, or
            any payment that repeats — the calendar and expected totals build
            themselves from here.
          </p>
        </div>
      ) : (
        <>
          <NextMonthSummary recurringPayments={recurringPayments} />
          {view === "grid" ? (
            <RecurringPaymentsList
              recurringPayments={recurringPayments}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          ) : (
            <PaymentCalendar
              recurringPayments={recurringPayments}
              onSelectDay={setDayDetail}
              onAddOnDay={openCreateOn}
            />
          )}
        </>
      )}

      <DayPaymentsDialog
        date={dayDetail}
        recurringPayments={recurringPayments}
        onOpenChange={(open) => {
          if (!open) setDayDetail(null);
        }}
        onEdit={openEdit}
        onDelete={openDelete}
        onAdd={openCreateOn}
      />

      <RecurringPaymentDialog
        open={isDialogOpen}
        editing={editing}
        initialDueDate={createOnDate}
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
            <DialogTitle>Delete recurring payment?</DialogTitle>
          </DialogHeader>
          {deleting && (
            <p className="text-sm text-muted-foreground">
              This will stop tracking{" "}
              <span className="font-medium text-foreground">
                {deleting.provider_name}
              </span>{" "}
              ({FREQUENCY_LABELS[deleting.frequency].toLowerCase()},{" "}
              {formatCurrency(deleting.amount)}). Already-logged expenses stay
              in your history.
            </p>
          )}
          {deleteMutation.error && (
            <p className="text-sm text-destructive">
              {deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : "Failed to delete recurring payment"}
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
