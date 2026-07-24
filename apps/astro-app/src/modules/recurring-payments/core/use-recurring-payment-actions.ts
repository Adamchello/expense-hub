"use client";

import { useState } from "react";
import type { RecurringPayment } from "../domain/recurring-payment";
import { useDeleteRecurringPayment } from "./store";

/**
 * The create / edit / delete choreography for a recurring payment.
 *
 * Two surfaces now open these dialogs — the grid on History and the calendar
 * beside it — and both need the same rule: one dialog at a time. Whoever opens
 * the next one closes the last, which is why every opener resets the others
 * rather than trusting the caller to.
 */
export function useRecurringPaymentActions() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringPayment | null>(null);
  const [deleting, setDeleting] = useState<RecurringPayment | null>(null);
  const [createOnDate, setCreateOnDate] = useState<string | null>(null);

  const deleteMutation = useDeleteRecurringPayment();

  const openCreate = () => {
    setEditing(null);
    setCreateOnDate(null);
    setIsFormOpen(true);
  };

  /** Clicking a free calendar day starts a payment already due that day. */
  const openCreateOn = (date: string) => {
    setEditing(null);
    setCreateOnDate(date);
    setIsFormOpen(true);
  };

  const openEdit = (payment: RecurringPayment) => {
    setCreateOnDate(null);
    setEditing(payment);
    setIsFormOpen(true);
  };

  // Delete always arrives from another dialog (the day detail, or the edit
  // form), so close whatever is open first.
  const openDelete = (payment: RecurringPayment) => {
    setIsFormOpen(false);
    setEditing(null);
    setDeleting(payment);
  };

  const confirmDelete = () => {
    if (!deleting) return;
    deleteMutation.mutate(deleting.id, {
      onSuccess: () => setDeleting(null),
    });
  };

  return {
    isFormOpen,
    setIsFormOpen,
    editing,
    deleting,
    setDeleting,
    createOnDate,
    openCreate,
    openCreateOn,
    openEdit,
    openDelete,
    confirmDelete,
    deleteMutation,
  };
}

export type RecurringPaymentActions = ReturnType<
  typeof useRecurringPaymentActions
>;
