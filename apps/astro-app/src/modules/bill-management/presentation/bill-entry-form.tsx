"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Bill } from "../domain/bill";
import type { Category } from "../domain/category";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateBill } from "../core/store";
import { useCategoryOptions } from "@/modules/category-management/core/use-category-options";

interface FormState {
  amount: string;
  date: string;
  providerName: string;
  description: string;
  /** Built-in or custom category name. */
  category: string | undefined;
}

const getInitialFormState = (bill?: Bill | null): FormState =>
  bill
    ? {
        amount: String(bill.amount),
        date: bill.date,
        providerName: bill.provider_name,
        description: bill.description ?? "",
        category: bill.category,
      }
    : {
        amount: "",
        date: new Date().toISOString().split("T")[0],
        providerName: "",
        description: "",
        category: undefined,
      };

export interface BillSubmitData {
  amount: number;
  date: string;
  providerName: string;
  description: string | null;
  category: Category;
}

interface BillFormBodyProps {
  /** When false the form resets (mirrors the old close-resets-form behavior). */
  active: boolean;
  onCancel: () => void;
  onSubmit: (data: BillSubmitData) => void;
  /** Prefills the form and expands the details section (edit mode). */
  initialBill?: Bill | null;
  error: unknown;
  isPending: boolean;
  successMessage?: string | null;
  submitLabel: string;
  pendingLabel: string;
  errorFallback: string;
}

export function BillFormBody({
  active,
  onCancel,
  onSubmit,
  initialBill,
  error,
  isPending,
  successMessage,
  submitLabel,
  pendingLabel,
  errorFallback,
}: BillFormBodyProps) {
  const isEdit = !!initialBill;
  const [formState, setFormState] = useState<FormState>(() =>
    getInitialFormState(initialBill),
  );
  const [showMore, setShowMore] = useState(isEdit);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const { groups: categoryGroups } = useCategoryOptions();

  useEffect(() => {
    if (active) {
      setFormState(getInitialFormState(initialBill));
      setShowMore(isEdit);
    }
  }, [active, initialBill, isEdit]);

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
      // so an unnamed bill is filed under its category.
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
        <Popover modal open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Category"
              className={cn(
                "flex h-11 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50",
                formState.category
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {formState.category ?? "Choose a category"}
              <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="center"
            className="w-(--radix-popover-trigger-width) min-w-80 p-3"
          >
            <div className="flex flex-col gap-3">
              {categoryGroups.map((group) => (
                <div key={group.label} className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        aria-pressed={formState.category === category}
                        onClick={() => {
                          updateField("category", category);
                          setIsCategoryOpen(false);
                        }}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                          formState.category === category
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        )}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
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
                onChange={(e) => updateField("providerName", e.target.value)}
              />
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

interface BillEntryFormBodyProps {
  /** When false the form resets (mirrors the old close-resets-form behavior). */
  active: boolean;
  onCancel: () => void;
}

export function BillEntryFormBody({
  active,
  onCancel,
}: BillEntryFormBodyProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formEpoch, setFormEpoch] = useState(0);

  const { mutate: mutateCreateBill, reset, error, isPending } = useCreateBill();

  useEffect(() => {
    if (!active) {
      setSuccessMessage(null);
      reset();
    }
  }, [active, reset]);

  const handleSubmit = (data: BillSubmitData) => {
    mutateCreateBill(data, {
      onSuccess: () => {
        setSuccessMessage("Bill saved successfully!");
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
    <BillFormBody
      key={formEpoch}
      active={active}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      error={error}
      isPending={isPending}
      successMessage={successMessage}
      submitLabel="Save Bill"
      pendingLabel="Saving..."
      errorFallback="Failed to save bill"
    />
  );
}

interface BillEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BillEntryForm({ open, onOpenChange }: BillEntryFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Bill</DialogTitle>
        </DialogHeader>
        <BillEntryFormBody active={open} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
