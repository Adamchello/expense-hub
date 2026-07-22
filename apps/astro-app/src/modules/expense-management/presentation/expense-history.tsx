"use client";

import { useMemo, useState } from "react";
import type { Expense } from "../domain/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Amount,
  ConfirmDialog,
  EmptyState,
  RecordCard,
} from "@/components/shared";
import { formatDate, formatMonth } from "@/shared/format";
import { toast } from "@/lib/toast";
import { queryClient } from "@/lib/query-client";
import { useDeleteExpense } from "../core/store";
import { createExpense } from "../integration/repository";
import { exportExpensesToCsv, exportExpensesToExcel } from "../core/export";
import { EditExpenseDialog } from "./edit-expense-dialog";
import { ArrowUpDown, Download, Receipt, Search } from "lucide-react";

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
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const deleteMutation = useDeleteExpense();

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

  // Undo re-creates the deleted expense from its client-side snapshot.
  const restoreExpense = async (removed: Expense) => {
    try {
      await createExpense({
        amount: removed.amount,
        date: removed.date,
        providerName: removed.provider_name,
        description: removed.description,
        category: removed.category,
      });
      toast("Expense restored");
    } catch {
      toast("Failed to restore expense", { variant: "error" });
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
          undo: () => restoreExpense(removed),
        });
      },
    });
  };

  if (expenses.length === 0) {
    return (
      <EmptyState
        variant="block"
        icon={Receipt}
        title="No expenses yet"
        description="Add your first expense and this becomes a searchable history — filter by month or category, group by month, and export the whole lot whenever you need it."
      />
    );
  }

  // The card is the affordance: clicking it opens the record for editing, and
  // Delete lives inside that dialog. No hover-revealed menu stealing the
  // amount's right edge or shifting it on mouseover.
  const renderExpenseCard = (expense: Expense) => (
    <RecordCard
      key={expense.id}
      name={expense.provider_name}
      amount={expense.amount}
      category={expense.category}
      meta={formatDate(expense.date)}
      note={expense.description}
      onOpen={() => setEditingExpense(expense)}
      openLabel={`Edit expense from ${expense.provider_name}`}
    />
  );

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

      {filteredExpenses.length === 0 ? (
        <EmptyState
          variant="block"
          description="No expenses match the selected filters."
        />
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
        onRequestDelete={(expense) => {
          // Hand off from edit to the confirm step so only one dialog is open.
          setEditingExpense(null);
          setDeletingExpense(expense);
        }}
      />

      {/* Single delete confirmation */}
      <ConfirmDialog
        open={!!deletingExpense}
        onOpenChange={(open) => {
          if (!open) setDeletingExpense(null);
        }}
        title="Delete expense?"
        description={
          deletingExpense && (
            <>
              This will permanently remove the{" "}
              <Amount value={deletingExpense.amount} size="inherit" /> expense
              from{" "}
              <span className="font-medium text-foreground">
                {deletingExpense.provider_name}
              </span>
              .
            </>
          )
        }
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        onConfirm={handleConfirmDelete}
        isPending={deleteMutation.isPending}
        error={deleteMutation.error}
        errorFallback="Failed to delete expense"
      />
    </div>
  );
}
