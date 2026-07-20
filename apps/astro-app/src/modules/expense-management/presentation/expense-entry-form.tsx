"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Expense } from "../domain/expense";
import type { Category } from "../domain/category";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateExpense } from "../core/store";
import { suggestCategory } from "../core/category-suggestion";
import { CategoryPickerPopover } from "@/modules/category-management/presentation/category-picker-popover";

interface FormState {
  amount: string;
  date: string;
  providerName: string;
  description: string;
  /** Built-in or custom category name. */
  category: string | undefined;
}

const getInitialFormState = (expense?: Expense | null): FormState =>
  expense
    ? {
        amount: String(expense.amount),
        date: expense.date,
        providerName: expense.provider_name,
        description: expense.description ?? "",
        category: expense.category,
      }
    : {
        amount: "",
        date: new Date().toISOString().split("T")[0],
        providerName: "",
        description: "",
        category: undefined,
      };

export interface ExpenseSubmitData {
  amount: number;
  date: string;
  providerName: string;
  description: string | null;
  category: Category;
}

interface ExpenseFormBodyProps {
  /** When false the form resets (mirrors the old close-resets-form behavior). */
  active: boolean;
  onCancel: () => void;
  onSubmit: (data: ExpenseSubmitData) => void;
  /** Prefills the form and expands the details section (edit mode). */
  initialExpense?: Expense | null;
  error: unknown;
  isPending: boolean;
  successMessage?: string | null;
  submitLabel: string;
  pendingLabel: string;
  errorFallback: string;
}

export function ExpenseFormBody({
  active,
  onCancel,
  onSubmit,
  initialExpense,
  error,
  isPending,
  successMessage,
  submitLabel,
  pendingLabel,
  errorFallback,
}: ExpenseFormBodyProps) {
  const isEdit = !!initialExpense;
  const [formState, setFormState] = useState<FormState>(() =>
    getInitialFormState(initialExpense),
  );
  const [showMore, setShowMore] = useState(isEdit);
  // Once the user picks a category themselves, payee typing stops overriding it.
  const [categoryTouched, setCategoryTouched] = useState(isEdit);

  useEffect(() => {
    if (active) {
      setFormState(getInitialFormState(initialExpense));
      setShowMore(isEdit);
      setCategoryTouched(isEdit);
    }
  }, [active, initialExpense, isEdit]);

  const handleProviderChange = (value: string) => {
    setFormState((prev) => {
      const suggestion = suggestCategory(value);
      const shouldSuggest = !categoryTouched && suggestion !== "Uncategorized";
      return {
        ...prev,
        providerName: value,
        category: shouldSuggest ? suggestion : prev.category,
      };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formState.amount || !formState.date) {
      return;
    }

    const amountNum = parseFloat(formState.amount);
    if (isNaN(amountNum) || amountNum < 0) {
      return;
    }

    const category = (formState.category || "Uncategorized") as Category;

    onSubmit({
      amount: amountNum,
      date: formState.date,
      // Provider is optional in the UI; the API requires a non-empty name,
      // so an unnamed expense is filed under its category.
      providerName: formState.providerName.trim() || category,
      description: formState.description.trim() || null,
      category,
    });
  };

  const updateField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const isFormValid = formState.amount && formState.date;

  // Scale the hero amount down as the number grows, and let the input
  // width track its content so digits never get clipped.
  const amountLength = Math.max(formState.amount.length, 4);
  const amountSizeClass =
    amountLength <= 7
      ? "text-5xl"
      : amountLength <= 10
        ? "text-4xl"
        : "text-3xl";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-2">
      {error != null && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : errorFallback}
          </p>
        </div>
      )}

      {successMessage && (
        <div className="rounded-md bg-green-500/10 border border-green-500/20 p-3">
          <p className="text-sm text-green-600 dark:text-green-400">
            {successMessage}
          </p>
        </div>
      )}

      {/* Hero amount */}
      <div className="flex flex-col items-center gap-1 pt-2">
        <label
          htmlFor="amount"
          className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          How much?
        </label>
        <div className="flex w-full min-w-0 items-baseline justify-center">
          <span
            className={cn(
              "shrink-0 font-mono font-semibold text-muted-foreground",
              amountLength <= 7 ? "text-3xl" : "text-2xl",
            )}
          >
            $
          </span>
          <input
            id="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            autoFocus
            value={formState.amount}
            onChange={(e) => updateField("amount", e.target.value)}
            required
            aria-invalid={error != null && !formState.amount ? "true" : "false"}
            style={{ width: `${amountLength + 1}ch` }}
            className={cn(
              "max-w-full border-none bg-transparent text-center font-mono font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
              amountSizeClass,
            )}
          />
        </div>
      </div>

      {/* Category — the primary choice */}
      <div className="flex flex-col gap-1.5">
        <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          What was it for?
        </p>
        <CategoryPickerPopover
          value={formState.category}
          onSelect={(category) => {
            updateField("category", category);
            setCategoryTouched(true);
          }}
        />
      </div>

      {/* Details — provider, date, note, tucked away */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => setShowMore((prev) => !prev)}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform",
              showMore && "rotate-180",
            )}
          />
          {showMore ? "Hide details" : "Add details (payee, date, note)"}
        </button>

        {showMore && (
          <div className="flex w-full flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="provider" className="text-sm font-medium">
                Who did you pay?{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Input
                id="provider"
                type="text"
                placeholder="e.g. Electric Company"
                value={formState.providerName}
                onChange={(e) => handleProviderChange(e.target.value)}
              />
              {!categoryTouched &&
                formState.category &&
                formState.category !== "Uncategorized" && (
                  <p className="text-xs text-muted-foreground">
                    Suggested category:{" "}
                    <span className="font-medium text-foreground">
                      {formState.category}
                    </span>
                  </p>
                )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="date" className="text-sm font-medium">
                Date
              </label>
              <Input
                id="date"
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={formState.date}
                onChange={(e) => updateField("date", e.target.value)}
                required
                aria-invalid={
                  error != null && !formState.date ? "true" : "false"
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className="text-sm font-medium">
                Note (optional)
              </label>
              <Textarea
                id="description"
                placeholder="Add a description..."
                value={formState.description}
                onChange={(e) => {
                  if (e.target.value.length <= 100) {
                    updateField("description", e.target.value);
                  }
                }}
                maxLength={100}
                rows={2}
              />
              <p className="text-right text-xs text-muted-foreground">
                {formState.description.length}/100
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="lg"
          className="flex-1"
          disabled={!isFormValid || isPending}
        >
          {isPending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}

interface ExpenseEntryFormBodyProps {
  /** When false the form resets (mirrors the old close-resets-form behavior). */
  active: boolean;
  onCancel: () => void;
}

export function ExpenseEntryFormBody({
  active,
  onCancel,
}: ExpenseEntryFormBodyProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formEpoch, setFormEpoch] = useState(0);

  const {
    mutate: mutateCreateExpense,
    reset,
    error,
    isPending,
  } = useCreateExpense();

  useEffect(() => {
    if (!active) {
      setSuccessMessage(null);
      reset();
    }
  }, [active, reset]);

  const handleSubmit = (data: ExpenseSubmitData) => {
    mutateCreateExpense(data, {
      onSuccess: () => {
        setSuccessMessage("Expense saved successfully!");
        // Remount the form body so it returns to a pristine state.
        setFormEpoch((prev) => prev + 1);

        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      },
      onError: (error) => {
        console.error("Error submitting form:", error);
      },
    });
  };

  return (
    <ExpenseFormBody
      key={formEpoch}
      active={active}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      error={error}
      isPending={isPending}
      successMessage={successMessage}
      submitLabel="Save Expense"
      pendingLabel="Saving..."
      errorFallback="Failed to save expense"
    />
  );
}

interface ExpenseEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseEntryForm({
  open,
  onOpenChange,
}: ExpenseEntryFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
        </DialogHeader>
        <ExpenseEntryFormBody
          active={open}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
