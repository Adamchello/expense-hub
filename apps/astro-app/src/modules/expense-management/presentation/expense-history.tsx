"use client";

import { useMemo, useState } from "react";
import type { Expense } from "../domain/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
import { CardActionsMenu } from "@/components/ui/card-actions-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, formatMonth } from "@/shared/format";
import { toast } from "@/lib/toast";
import { queryClient } from "@/lib/query-client";
import { useCategoryOptions } from "@/modules/category-management/core/use-category-options";
import { useDeleteExpense, useBulkDeleteExpenses } from "../core/store";
import { createExpense } from "../integration/repository";
import { exportExpensesToCsv, exportExpensesToExcel } from "../core/export";
import { EditExpenseDialog } from "./edit-expense-dialog";
import { ArrowUpDown, Download, Pencil, Search, Trash2 } from "lucide-react";

const ALL = "all";

type SortOrder =
  | "date-desc"
  | "date-asc"
  | "amount-desc"
  | "amount-asc"
  | "name-asc";

const SORT_LABELS: Record<SortOrder, string> = {
  "date-desc": "Newest first",
  "date-asc": "Oldest first",
  "amount-desc": "Amount: high to low",
  "amount-asc": "Amount: low to high",
  "name-asc": "Payee A–Z",
};

const SORT_COMPARATORS: Record<SortOrder, (a: Expense, b: Expense) => number> =
  {
    "date-desc": (a, b) => b.date.localeCompare(a.date),
    "date-asc": (a, b) => a.date.localeCompare(b.date),
    "amount-desc": (a, b) => b.amount - a.amount,
    "amount-asc": (a, b) => a.amount - b.amount,
    "name-asc": (a, b) => a.provider_name.localeCompare(b.provider_name),
  };

interface ExpenseHistoryProps {
  expenses: Expense[];
}

export function ExpenseHistory({ expenses }: ExpenseHistoryProps) {
  const [monthFilter, setMonthFilter] = useState<string>(ALL);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("date-desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);

  const { washClassFor, textClassFor } = useCategoryOptions();
  const deleteMutation = useDeleteExpense();
  const bulkDeleteMutation = useBulkDeleteExpenses();

  const monthOptions = useMemo(() => {
    const months = new Set(expenses.map((expense) => expense.date.slice(0, 7)));
    return [...months].sort((a, b) => b.localeCompare(a));
  }, [expenses]);

  const categoryOptions = useMemo(() => {
    const categories = new Set(expenses.map((expense) => expense.category));
    return [...categories].sort();
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return expenses
      .filter(
        (expense) =>
          (monthFilter === ALL || expense.date.startsWith(monthFilter)) &&
          (categoryFilter === ALL || expense.category === categoryFilter) &&
          (term === "" ||
            expense.provider_name.toLowerCase().includes(term) ||
            (expense.description ?? "").toLowerCase().includes(term) ||
            expense.category.toLowerCase().includes(term)),
      )
      .sort(SORT_COMPARATORS[sortOrder]);
  }, [expenses, monthFilter, categoryFilter, searchTerm, sortOrder]);

  const isGroupedByMonth =
    sortOrder === "date-desc" || sortOrder === "date-asc";

  const groupedExpenses = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    filteredExpenses.forEach((expense) => {
      (groups[expense.date.slice(0, 7)] ??= []).push(expense);
    });
    return groups;
  }, [filteredExpenses]);

  const sortedMonths = useMemo(() => {
    const months = Object.keys(groupedExpenses);
    return sortOrder === "date-asc" ? months.sort() : months.sort().reverse();
  }, [groupedExpenses, sortOrder]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Undo re-creates the deleted expenses from their client-side snapshots.
  const restoreExpenses = async (removed: Expense[]) => {
    try {
      for (const expense of removed) {
        await createExpense({
          amount: expense.amount,
          date: expense.date,
          providerName: expense.provider_name,
          description: expense.description,
          category: expense.category,
        });
      }
      toast(removed.length === 1 ? "Expense restored" : "Expenses restored");
    } catch {
      toast("Failed to restore expenses", { variant: "error" });
    } finally {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingExpense) return;
    const removed = deletingExpense;
    deleteMutation.mutate(removed.id, {
      onSuccess: () => {
        setDeletingExpense(null);
        toast(`Deleted ${removed.provider_name} expense`, {
          undo: () => restoreExpenses([removed]),
        });
      },
    });
  };

  const handleConfirmBulkDelete = () => {
    const removed = expenses.filter((expense) => selectedIds.has(expense.id));
    bulkDeleteMutation.mutate([...selectedIds], {
      onSuccess: () => {
        setSelectedIds(new Set());
        setIsBulkConfirmOpen(false);
        toast(`Deleted ${removed.length} expenses`, {
          undo: () => restoreExpenses(removed),
        });
      },
    });
  };

  if (expenses.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          No expenses yet. Add your first expense to get started!
        </p>
      </div>
    );
  }

  // Clicking a card toggles selection; row actions live in the ⋯ menu.
  const renderExpenseCard = (expense: Expense) => {
    const isSelected = selectedIds.has(expense.id);
    return (
      <div
        key={expense.id}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={`Select expense from ${expense.provider_name}`}
        onClick={() => toggleSelected(expense.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleSelected(expense.id);
          }
        }}
        className={cn(
          "group relative cursor-pointer rounded-lg border p-3 transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          washClassFor(expense.category),
          isSelected && "ring-2 ring-primary",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <h4 className="min-w-0 flex-1 truncate text-sm font-semibold">
            {expense.provider_name}
          </h4>
          <p className="shrink-0 font-mono text-sm font-semibold tracking-tight">
            {formatCurrency(expense.amount)}
          </p>
          <CardActionsMenu
            label={`Actions for expense from ${expense.provider_name}`}
            actions={[
              {
                label: "Edit",
                icon: Pencil,
                onClick: () => setEditingExpense(expense),
              },
              {
                label: "Delete",
                icon: Trash2,
                destructive: true,
                onClick: () => setDeletingExpense(expense),
              },
            ]}
          />
        </div>
        <p
          className={cn(
            "mt-1 text-[11px] font-semibold",
            textClassFor(expense.category),
          )}
        >
          {expense.category}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {formatDate(expense.date)}
        </p>
        {expense.description && (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {expense.description}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters + exports. Search leads full-width; the three selects flex
          so they never tower or clip on a phone. */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search payee, note or category"
            aria-label="Search expenses"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger
              className="w-full flex-1 sm:w-40 sm:flex-none"
              aria-label="Filter by month"
            >
              <SelectValue placeholder="All months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All months</SelectItem>
              {monthOptions.map((month) => (
                <SelectItem key={month} value={month}>
                  {formatMonth(month)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger
              className="w-full flex-1 sm:w-40 sm:flex-none"
              aria-label="Filter by category"
            >
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sortOrder}
            onValueChange={(value) => setSortOrder(value as SortOrder)}
          >
            <SelectTrigger
              className="w-full flex-1 sm:w-48 sm:flex-none"
              aria-label="Sort expenses"
            >
              <ArrowUpDown className="size-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as SortOrder[]).map((order) => (
                <SelectItem key={order} value={order}>
                  {SORT_LABELS[order]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(monthFilter !== ALL ||
            categoryFilter !== ALL ||
            searchTerm !== "" ||
            sortOrder !== "date-desc") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMonthFilter(ALL);
                setCategoryFilter(ALL);
                setSearchTerm("");
                setSortOrder("date-desc");
              }}
            >
              Clear filters
            </Button>
          )}
          <div className="ml-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="size-3.5" />
                  Export
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-40 p-1">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => {
                    exportExpensesToCsv(expenses);
                    toast("Exported expenses as CSV");
                  }}
                >
                  <Download className="size-3.5" />
                  CSV
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => {
                    exportExpensesToExcel(expenses);
                    toast("Exported expenses as Excel");
                  }}
                >
                  <Download className="size-3.5" />
                  Excel
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Selection toolbar — appears once cards are selected by clicking them */}
      {selectedIds.size > 0 && (
        <div className="sticky top-16 z-20 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card/95 px-3 py-2 text-sm shadow-sm backdrop-blur">
          <span className="font-medium">{selectedIds.size} selected</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsBulkConfirmOpen(true)}
          >
            <Trash2 className="size-3.5" />
            Delete selected
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear selection
          </Button>
        </div>
      )}

      {filteredExpenses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No expenses match the selected filters.
          </p>
        </div>
      ) : isGroupedByMonth ? (
        <div className="space-y-6">
          {sortedMonths.map((month) => (
            <div key={month} className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {formatMonth(month)}
                </h3>
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  {groupedExpenses[month].length}{" "}
                  {groupedExpenses[month].length === 1 ? "expense" : "expenses"}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {groupedExpenses[month].map(renderExpenseCard)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredExpenses.map(renderExpenseCard)}
        </div>
      )}

      <EditExpenseDialog
        expense={editingExpense}
        onOpenChange={(open) => {
          if (!open) setEditingExpense(null);
        }}
      />

      {/* Single delete confirmation */}
      <Dialog
        open={!!deletingExpense}
        onOpenChange={(open) => {
          if (!open) setDeletingExpense(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete expense?</DialogTitle>
          </DialogHeader>
          {deletingExpense && (
            <p className="text-sm text-muted-foreground">
              This will permanently remove the{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(deletingExpense.amount)}
              </span>{" "}
              expense from{" "}
              <span className="font-medium text-foreground">
                {deletingExpense.provider_name}
              </span>
              .
            </p>
          )}
          {deleteMutation.error && (
            <p className="text-sm text-destructive">
              {deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : "Failed to delete expense"}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setDeletingExpense(null)}
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

      {/* Bulk delete confirmation */}
      <Dialog open={isBulkConfirmOpen} onOpenChange={setIsBulkConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} expenses?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove the{" "}
            <span className="font-medium text-foreground">
              {selectedIds.size}
            </span>{" "}
            selected {selectedIds.size === 1 ? "expense" : "expenses"}. This
            cannot be undone.
          </p>
          {bulkDeleteMutation.error && (
            <p className="text-sm text-destructive">
              {bulkDeleteMutation.error instanceof Error
                ? bulkDeleteMutation.error.message
                : "Failed to delete expenses"}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setIsBulkConfirmOpen(false)}
              disabled={bulkDeleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete selected"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
