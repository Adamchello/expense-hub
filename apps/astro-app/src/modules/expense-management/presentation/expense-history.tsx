"use client";

import { useMemo, useState } from "react";
import type { Expense } from "../domain/expense";
import type { Category } from "@/shared/domain/category";
import type { DataE2E } from "@/__e2e__/data-e2e";
import { Button } from "@/libs/ui/button";
import { Input } from "@/libs/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/libs/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/libs/ui/popover";
import {
  Amount,
  ConfirmDialog,
  EmptyState,
  ListGroupHeader,
  RecordCard,
  SectionLabel,
} from "@/components/shared";
import { formatCurrency, formatDate, formatMonth } from "@/shared/format";
import { toast } from "@/libs/ui/toast";
import { queryClient } from "@/lib/query-client";
import { useDeleteExpense } from "../core/store";
import { createExpense } from "../integration/repository";
import { exportExpensesToCsv, exportExpensesToExcel } from "../core/export";
import { EditExpenseDialog } from "./edit-expense-dialog";
import {
  ArrowUpDown,
  ChevronDown,
  Download,
  Filter,
  Receipt,
  Search,
} from "lucide-react";

const ALL = "all";

type SortOrder =
  "date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "name-asc";

const SORT_LABELS: Record<SortOrder, string> = {
  "date-desc": "Newest first",
  "date-asc": "Oldest first",
  "amount-desc": "Amount: high to low",
  "amount-asc": "Amount: low to high",
  "name-asc": "Payee A–Z",
};

/**
 * The shape the filters and the sorts read. Expenses and incoming records are
 * different things with different actions, but they are searched, filtered and
 * ordered identically — so that part of them is expressed once, here.
 */
interface SortableRecord {
  date: string;
  amount: number;
  name: string;
  category: string;
  description: string | null;
}

const SORT_COMPARATORS: Record<
  SortOrder,
  (a: SortableRecord, b: SortableRecord) => number
> = {
  "date-desc": (a, b) => b.date.localeCompare(a.date),
  "date-asc": (a, b) => a.date.localeCompare(b.date),
  "amount-desc": (a, b) => b.amount - a.amount,
  "amount-asc": (a, b) => a.amount - b.amount,
  "name-asc": (a, b) => a.name.localeCompare(b.name),
};

const sortableExpense = (expense: Expense): SortableRecord => ({
  date: expense.date,
  amount: expense.amount,
  name: expense.provider_name,
  category: expense.category,
  description: expense.description,
});

/**
 * A record that has not happened yet — a recurring payment, projected.
 *
 * The register renders it as a plain view model rather than importing the
 * recurring-payments module: this file owns "what a searchable list of records
 * looks like", not what a recurring payment is. Whoever composes the page maps
 * one into the other.
 */
export interface IncomingRecord {
  id: string;
  name: string;
  amount: number;
  category: Category;
  description: string | null;
  /** Due date (YYYY-MM-DD) — filtered and sorted with the expense dates. */
  date: string;
  /** Trails the category chip, e.g. "· Monthly". */
  categorySuffix?: string;
  meta: string;
  metaTestId?: DataE2E;
  openLabel: string;
  onOpen: () => void;
}

interface ExpenseHistoryProps {
  expenses: Expense[];
  /** Prepended as the "Incoming" group, under the same filters and sort. */
  incoming?: IncomingRecord[];
  /** Sits on the Incoming divider, e.g. "New recurring payment". */
  incomingAction?: React.ReactNode;
}

export function ExpenseHistory({
  expenses,
  incoming = [],
  incomingAction,
}: ExpenseHistoryProps) {
  const [monthFilter, setMonthFilter] = useState<string>(ALL);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("date-desc");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const deleteMutation = useDeleteExpense();

  // Incoming months belong in the picker too, or filtering to next August
  // silently drops the only records that exist there.
  const monthOptions = useMemo(() => {
    const months = new Set([
      ...expenses.map((expense) => expense.date.slice(0, 7)),
      ...incoming.map((record) => record.date.slice(0, 7)),
    ]);
    return [...months].sort((a, b) => b.localeCompare(a));
  }, [expenses, incoming]);

  const categoryOptions = useMemo(() => {
    const categories = new Set([
      ...expenses.map((expense) => expense.category as string),
      ...incoming.map((record) => record.category),
    ]);
    return [...categories].sort();
  }, [expenses, incoming]);

  // One predicate for both lists — the filters read as filters only if a
  // search for "netflix" hides the Netflix subscription too.
  const matchesFilters = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return (record: SortableRecord) =>
      (monthFilter === ALL || record.date.startsWith(monthFilter)) &&
      (categoryFilter === ALL || record.category === categoryFilter) &&
      (term === "" ||
        record.name.toLowerCase().includes(term) ||
        (record.description ?? "").toLowerCase().includes(term) ||
        record.category.toLowerCase().includes(term));
  }, [monthFilter, categoryFilter, searchTerm]);

  const filteredExpenses = useMemo(
    () =>
      expenses
        .filter((expense) => matchesFilters(sortableExpense(expense)))
        .sort((a, b) =>
          SORT_COMPARATORS[sortOrder](sortableExpense(a), sortableExpense(b)),
        ),
    [expenses, matchesFilters, sortOrder],
  );

  const filteredIncoming = useMemo(
    () =>
      incoming
        .filter(matchesFilters)
        .sort((a, b) => SORT_COMPARATORS[sortOrder](a, b)),
    [incoming, matchesFilters, sortOrder],
  );

  const activeFilterCount =
    (monthFilter === ALL ? 0 : 1) + (categoryFilter === ALL ? 0 : 1);

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

  if (expenses.length === 0 && incoming.length === 0) {
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
      {/* One control row: search takes the space it deserves, the two
          narrowing controls sit beside it. Month and category used to be two
          more selects competing at the same size as search — they are behind
          one "Filters" surface now, which carries a count so a filter left on
          can never hide half the ledger silently. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search expenses..."
            aria-label="Search expenses"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 w-full rounded-xl pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-11 flex-1 justify-between gap-2 rounded-xl sm:flex-none"
              >
                <span className="flex items-center gap-2">
                  <Filter className="size-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 space-y-3">
              <div className="space-y-1.5">
                <SectionLabel as="span">Month</SectionLabel>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger
                    className="w-full"
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
              </div>

              <div className="space-y-1.5">
                <SectionLabel as="span">Category</SectionLabel>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger
                    className="w-full"
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
              </div>

              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setMonthFilter(ALL);
                    setCategoryFilter(ALL);
                  }}
                >
                  Clear filters
                </Button>
              )}
            </PopoverContent>
          </Popover>

          <Select
            value={sortOrder}
            onValueChange={(value) => setSortOrder(value as SortOrder)}
          >
            <SelectTrigger
              className="h-11 flex-1 gap-2 rounded-xl sm:w-56 sm:flex-none"
              aria-label="Sort expenses"
            >
              <ArrowUpDown className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">Sorting:</span>
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

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-11 shrink-0 rounded-xl"
                aria-label="Export expenses"
              >
                <Download className="size-4" />
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

      {/* Incoming heads the ledger and stays its own group under every sort —
          money that has not left yet does not belong under a month heading
          that claims it did. */}
      {(filteredIncoming.length > 0 || incomingAction) && (
        <div className="space-y-3">
          <ListGroupHeader
            title="Incoming"
            meta={
              filteredIncoming.length > 0 &&
              `${filteredIncoming.length} recurring`
            }
            action={incomingAction}
          />
          {/* No "Total" here on purpose: a weekly and a monthly payment are
              not addable numbers, and a sum that means nothing next to a
              month total that means something is worse than no sum. */}
          {filteredIncoming.length === 0 ? (
            <EmptyState
              variant="inline"
              description={
                incoming.length === 0
                  ? "Nothing repeats yet. Add rent, a subscription, or any payment that comes back."
                  : "No recurring payments match the selected filters."
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredIncoming.map((record) => (
                <RecordCard
                  key={record.id}
                  name={record.name}
                  amount={record.amount}
                  category={record.category}
                  categorySuffix={record.categorySuffix}
                  meta={record.meta}
                  metaTestId={record.metaTestId}
                  note={record.description}
                  onOpen={record.onOpen}
                  openLabel={record.openLabel}
                  flag="Recurring"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {filteredExpenses.length === 0 ? (
        <EmptyState
          variant="block"
          description="No expenses match the selected filters."
        />
      ) : isGroupedByMonth ? (
        <div className="space-y-6">
          {sortedMonths.map((month) => (
            <div key={month} className="space-y-3">
              <ListGroupHeader
                title={formatMonth(month)}
                total={`Total: ${formatCurrency(
                  groupedExpenses[month].reduce(
                    (sum, expense) => sum + expense.amount,
                    0,
                  ),
                )}`}
                meta={`${groupedExpenses[month].length} ${
                  groupedExpenses[month].length === 1 ? "expense" : "expenses"
                }`}
              />
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
