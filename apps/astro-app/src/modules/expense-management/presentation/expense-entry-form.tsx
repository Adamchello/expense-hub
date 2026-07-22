"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Expense } from "../domain/expense";
import type { Category } from "../domain/category";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Callout,
  errorMessage,
  HeroAmountField,
  SectionLabel,
} from "@/components/shared";
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
  /**
   * Leading action in the footer — used by edit mode for Delete, which lives
   * here rather than on the card so you can see what you're removing.
   */
  footerAction?: React.ReactNode;
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
  footerAction,
}: ExpenseFormBodyProps) {
  const isEdit = !!initialExpense;
  const [formState, setFormState] = useState<FormState>(() =>
    getInitialFormState(initialExpense),
  );
  const [showMore, setShowMore] = useState(isEdit);
  // Once the user picks a category themselves, payee typing stops overriding it.
  const [categoryTouched, setCategoryTouched] = useState(isEdit);
  // Surfaces a reason when Save does nothing (e.g. a negative amount) instead
  // of silently swallowing the click.
  const [amountError, setAmountError] = useState<string | null>(null);

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
      setAmountError("Enter an amount of 0 or more.");
      return;
    }
    setAmountError(null);

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

  return (
    // `noValidate` hands validation to handleSubmit — the native `min`/`required`
    // constraints blocked submit before our own amount message could ever render.
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-5 py-2"
    >
      {error != null && (
        <Callout variant="error">{errorMessage(error, errorFallback)}</Callout>
      )}

      {successMessage && <Callout variant="success">{successMessage}</Callout>}

      {/* Hero amount */}
      <HeroAmountField
        id="amount"
        label="How much?"
        value={formState.amount}
        onChange={(value) => {
          if (amountError) setAmountError(null);
          updateField("amount", value);
        }}
        error={amountError}
        autoFocus
        invalid={error != null && !formState.amount}
      />

      {/* Category — the primary choice */}
      <div className="flex flex-col gap-1.5">
        <SectionLabel className="text-center">What was it for?</SectionLabel>
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
        {footerAction}
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
          loading={isPending}
          disabled={!isFormValid}
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
