"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/ui/skeleton";
import {
  Callout,
  ConfirmDialog,
  EmptyState,
  SegmentedControl,
  errorMessage,
} from "@/components/shared";
import { formatCurrency } from "@/shared/format";
import { FREQUENCY_LABELS } from "@/shared/domain/recurrence";
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
        <SegmentedControl
          value={view}
          onChange={setView}
          options={VIEWS}
          label="Recurring payments view"
        />
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          New Recurring Payment
        </Button>
      </div>

      {query.error && (
        <Callout variant="error">
          {errorMessage(query.error, "Failed to load recurring payments")}
        </Callout>
      )}

      {query.isLoading ? (
        <SkeletonList rows={3} />
      ) : recurringPayments.length === 0 ? (
        <EmptyState description="No recurring payments yet. Create one for rent, subscriptions, or any payment that repeats — the calendar and expected totals build themselves from here." />
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
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
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
        onConfirm={handleConfirmDelete}
        isPending={deleteMutation.isPending}
        error={deleteMutation.error}
        errorFallback="Failed to delete recurring payment"
      />
    </div>
  );
}
