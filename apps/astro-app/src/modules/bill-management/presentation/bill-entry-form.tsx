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

const CATEGORY_GROUPS: { label: string; categories: Category[] }[] = [
  { label: "Home", categories: ["Utilities", "Housing"] },
  {
    label: "Everyday",
    categories: ["Food", "Transportation", "Shopping", "Pets"],
  },
  {
    label: "Health & Finance",
    categories: ["Healthcare", "Insurance", "Loans"],
  },
  { label: "Leisure", categories: ["Entertainment", "Subscriptions"] },
  {
    label: "Other",
    categories: ["Services", "Education", "Charity", "Uncategorized"],
  },
];

interface FormState {
  amount: string;
  date: string;
  providerName: string;
  description: string;
  category: Category | undefined;
}

const getInitialFormState = (): FormState => ({
  amount: "",
  date: new Date().toISOString().split("T")[0],
  providerName: "",
  description: "",
  category: undefined,
});

interface BillEntryFormBodyProps {
  /** When false the form resets (mirrors the old close-resets-form behavior). */
  active: boolean;
  onCancel: () => void;
}

export function BillEntryFormBody({
  active,
  onCancel,
}: BillEntryFormBodyProps) {
  const [formState, setFormState] = useState<FormState>(getInitialFormState);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const resetForm = useCallback(() => {
    setFormState(getInitialFormState());
    setSuccessMessage(null);
    setShowMore(false);
  }, []);

  const { mutate: mutateCreateBill, reset, error, isPending } = useCreateBill();

  // Override onSuccess behavior for form-specific needs
  const handleMutate = useCallback(
    (data: {
      amount: number;
      date: string;
      providerName: string;
      description: string | null;
      category: Category;
    }) => {
      mutateCreateBill(data, {
        onSuccess: () => {
          setSuccessMessage("Bill saved successfully!");
          resetForm();

          setTimeout(() => {
            setSuccessMessage(null);
          }, 3000);
        },
        onError: (error) => {
          console.error("Error submitting form:", error);
        },
      });
    },
    [mutateCreateBill, resetForm],
  );

  useEffect(() => {
    if (!active) {
      resetForm();
      reset();
    }
  }, [active, resetForm, reset]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formState.amount || !formState.date) {
      reset();
      return;
    }

    const amountNum = parseFloat(formState.amount);
    if (isNaN(amountNum) || amountNum < 0) {
      reset();
      return;
    }

    const category = formState.category || "Uncategorized";

    handleMutate({
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
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to save bill"}
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
            aria-invalid={error && !formState.amount ? "true" : "false"}
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
              {CATEGORY_GROUPS.map((group) => (
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
                aria-invalid={error && !formState.date ? "true" : "false"}
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
          {isPending ? "Saving..." : "Save Bill"}
        </Button>
      </div>
    </form>
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
