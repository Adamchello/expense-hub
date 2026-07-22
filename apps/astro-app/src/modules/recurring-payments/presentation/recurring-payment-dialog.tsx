"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
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
import {
  Callout,
  HeroAmountField,
  SectionLabel,
  errorMessage,
} from "@/components/shared";
import { CategoryPickerPopover } from "@/modules/category-management/presentation/category-picker-popover";
import type { Category } from "@/shared/domain/category";
import {
  FREQUENCIES,
  FREQUENCY_LABELS,
  type Frequency,
} from "@/shared/domain/recurrence";
import type { RecurringPayment } from "../domain/recurring-payment";
import {
  useCreateRecurringPayment,
  useUpdateRecurringPayment,
} from "../core/store";

interface RecurringPaymentDialogProps {
  open: boolean;
  /** When set the dialog edits this template; otherwise it creates a new one. */
  editing: RecurringPayment | null;
  /** Seeds the due date when creating — the calendar day that was clicked. */
  initialDueDate?: string | null;
  onOpenChange: (open: boolean) => void;
  /** Hands the template back for deletion; the caller owns confirm. */
  onRequestDelete?: (payment: RecurringPayment) => void;
}

const todayIso = () => new Date().toISOString().split("T")[0];

export function RecurringPaymentDialog({
  open,
  editing,
  initialDueDate = null,
  onOpenChange,
  onRequestDelete,
}: RecurringPaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [providerName, setProviderName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [nextDueDate, setNextDueDate] = useState(todayIso);

  const createMutation = useCreateRecurringPayment();
  const updateMutation = useUpdateRecurringPayment();
  const mutation = editing ? updateMutation : createMutation;

  useEffect(() => {
    if (open) {
      setAmount(editing ? String(editing.amount) : "");
      setProviderName(editing?.provider_name ?? "");
      setDescription(editing?.description ?? "");
      setCategory(editing?.category ?? undefined);
      setFrequency(editing?.frequency ?? "monthly");
      setNextDueDate(editing?.next_due_date ?? initialDueDate ?? todayIso());
      createMutation.reset();
      updateMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, initialDueDate]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    if (!providerName.trim() || !nextDueDate) return;

    const formData = {
      amount: amountNum,
      providerName: providerName.trim(),
      description: description.trim() || null,
      category: (category ?? "Uncategorized") as Category,
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

  const isFormValid = amount && providerName.trim() && nextDueDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Recurring Payment" : "New Recurring Payment"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-5 py-2"
        >
          {mutation.error != null && (
            <Callout variant="error">
              {errorMessage(mutation.error, "Failed to save recurring payment")}
            </Callout>
          )}

          {/* Hero amount */}
          <HeroAmountField
            id="recurring-amount"
            label="How much each time?"
            value={amount}
            onChange={setAmount}
            autoFocus
          />

          {/* Category — same picker as the add-expense form */}
          <div className="flex flex-col gap-1.5">
            <SectionLabel className="text-center">What is it for?</SectionLabel>
            <CategoryPickerPopover value={category} onSelect={setCategory} />
          </div>

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

          <div className="flex gap-2">
            {/* Delete sits with the record you're looking at, not on the card. */}
            {editing && onRequestDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Delete recurring payment ${editing.provider_name}`}
                disabled={mutation.isPending}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onRequestDelete(editing)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
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
              size="lg"
              className="flex-1"
              loading={mutation.isPending}
              disabled={!isFormValid}
            >
              {mutation.isPending
                ? "Saving..."
                : editing
                  ? "Save Changes"
                  : "Create Recurring Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
