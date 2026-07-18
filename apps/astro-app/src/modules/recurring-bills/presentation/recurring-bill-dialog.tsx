"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategoryOptions } from "@/modules/category-management/core/use-category-options";
import type { Category } from "@/shared/domain/category";
import {
  FREQUENCIES,
  FREQUENCY_LABELS,
  type Frequency,
} from "@/shared/domain/recurrence";
import type { RecurringBill } from "../domain/recurring-bill";
import { useCreateRecurringBill, useUpdateRecurringBill } from "../core/store";

interface RecurringBillDialogProps {
  open: boolean;
  /** When set the dialog edits this template; otherwise it creates a new one. */
  editing: RecurringBill | null;
  onOpenChange: (open: boolean) => void;
}

const todayIso = () => new Date().toISOString().split("T")[0];

export function RecurringBillDialog({
  open,
  editing,
  onOpenChange,
}: RecurringBillDialogProps) {
  const [amount, setAmount] = useState("");
  const [providerName, setProviderName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("Uncategorized");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [nextDueDate, setNextDueDate] = useState(todayIso);

  const createMutation = useCreateRecurringBill();
  const updateMutation = useUpdateRecurringBill();
  const mutation = editing ? updateMutation : createMutation;

  useEffect(() => {
    if (open) {
      setAmount(editing ? String(editing.amount) : "");
      setProviderName(editing?.provider_name ?? "");
      setDescription(editing?.description ?? "");
      setCategory(editing?.category ?? "Uncategorized");
      setFrequency(editing?.frequency ?? "monthly");
      setNextDueDate(editing?.next_due_date ?? todayIso());
      createMutation.reset();
      updateMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const { flat: allCategories } = useCategoryOptions();
  const categoryOptions = allCategories.includes(category)
    ? allCategories
    : [category, ...allCategories];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    if (!providerName.trim() || !nextDueDate) return;

    const formData = {
      amount: amountNum,
      providerName: providerName.trim(),
      description: description.trim() || null,
      category: category as Category,
      frequency,
      nextDueDate,
    };

    const options = { onSuccess: () => onOpenChange(false) };

    if (editing) {
      updateMutation.mutate({ id: editing.id, formData }, options);
    } else {
      createMutation.mutate(formData, options);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Recurring Bill" : "New Recurring Bill"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          {mutation.error != null && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive">
                {mutation.error instanceof Error
                  ? mutation.error.message
                  : "Failed to save recurring bill"}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="recurring-provider" className="text-sm font-medium">
              Who do you pay?
            </label>
            <Input
              id="recurring-provider"
              type="text"
              placeholder="e.g. Netflix, Landlord"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="recurring-amount" className="text-sm font-medium">
                Amount
              </label>
              <Input
                id="recurring-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="recurring-frequency"
                className="text-sm font-medium"
              >
                Frequency
              </label>
              <Select
                value={frequency}
                onValueChange={(value) => setFrequency(value as Frequency)}
              >
                <SelectTrigger id="recurring-frequency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {FREQUENCY_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="recurring-category"
                className="text-sm font-medium"
              >
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="recurring-category" className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="recurring-due" className="text-sm font-medium">
                Next due date
              </label>
              <Input
                id="recurring-due"
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="recurring-description"
              className="text-sm font-medium"
            >
              Note (optional)
            </label>
            <Textarea
              id="recurring-description"
              placeholder="Add a description..."
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= 100) {
                  setDescription(e.target.value);
                }
              }}
              maxLength={100}
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Saving..."
                : editing
                  ? "Save Changes"
                  : "Create Recurring Bill"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
