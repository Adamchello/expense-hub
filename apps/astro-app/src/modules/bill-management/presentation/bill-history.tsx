"use client";

import { useMemo, useState } from "react";
import type { Bill } from "../domain/bill";
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
import { useDeleteBill, useBulkDeleteBills } from "../core/store";
import { createBill } from "../integration/repository";
import { exportBillsToCsv, exportBillsToExcel } from "../core/export";
import { EditBillDialog } from "./edit-bill-dialog";
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

const SORT_COMPARATORS: Record<SortOrder, (a: Bill, b: Bill) => number> = {
  "date-desc": (a, b) => b.date.localeCompare(a.date),
  "date-asc": (a, b) => a.date.localeCompare(b.date),
  "amount-desc": (a, b) => b.amount - a.amount,
  "amount-asc": (a, b) => a.amount - b.amount,
  "name-asc": (a, b) => a.provider_name.localeCompare(b.provider_name),
};

interface BillHistoryProps {
  bills: Bill[];
}

export function BillHistory({ bills }: BillHistoryProps) {
  const [monthFilter, setMonthFilter] = useState<string>(ALL);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("date-desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [deletingBill, setDeletingBill] = useState<Bill | null>(null);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);

  const { washClassFor, textClassFor } = useCategoryOptions();
  const deleteMutation = useDeleteBill();
  const bulkDeleteMutation = useBulkDeleteBills();

  const monthOptions = useMemo(() => {
    const months = new Set(bills.map((bill) => bill.date.slice(0, 7)));
    return [...months].sort((a, b) => b.localeCompare(a));
  }, [bills]);

  const categoryOptions = useMemo(() => {
    const categories = new Set(bills.map((bill) => bill.category));
    return [...categories].sort();
  }, [bills]);

  const filteredBills = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return bills
      .filter(
        (bill) =>
          (monthFilter === ALL || bill.date.startsWith(monthFilter)) &&
          (categoryFilter === ALL || bill.category === categoryFilter) &&
          (term === "" ||
            bill.provider_name.toLowerCase().includes(term) ||
            (bill.description ?? "").toLowerCase().includes(term) ||
            bill.category.toLowerCase().includes(term)),
      )
      .sort(SORT_COMPARATORS[sortOrder]);
  }, [bills, monthFilter, categoryFilter, searchTerm, sortOrder]);

  const isGroupedByMonth =
    sortOrder === "date-desc" || sortOrder === "date-asc";

  const groupedBills = useMemo(() => {
    const groups: Record<string, Bill[]> = {};
    filteredBills.forEach((bill) => {
      (groups[bill.date.slice(0, 7)] ??= []).push(bill);
    });
    return groups;
  }, [filteredBills]);

  const sortedMonths = useMemo(() => {
    const months = Object.keys(groupedBills);
    return sortOrder === "date-asc" ? months.sort() : months.sort().reverse();
  }, [groupedBills, sortOrder]);

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

  // Undo re-creates the deleted bills from their client-side snapshots.
  const restoreBills = async (removed: Bill[]) => {
    try {
      for (const bill of removed) {
        await createBill({
          amount: bill.amount,
          date: bill.date,
          providerName: bill.provider_name,
          description: bill.description,
          category: bill.category,
        });
      }
      toast(removed.length === 1 ? "Bill restored" : "Bills restored");
    } catch {
      toast("Failed to restore bills", { variant: "error" });
    } finally {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingBill) return;
    const removed = deletingBill;
    deleteMutation.mutate(removed.id, {
      onSuccess: () => {
        setDeletingBill(null);
        toast(`Deleted ${removed.provider_name} bill`, {
          undo: () => restoreBills([removed]),
        });
      },
    });
  };

  const handleConfirmBulkDelete = () => {
    const removed = bills.filter((bill) => selectedIds.has(bill.id));
    bulkDeleteMutation.mutate([...selectedIds], {
      onSuccess: () => {
        setSelectedIds(new Set());
        setIsBulkConfirmOpen(false);
        toast(`Deleted ${removed.length} bills`, {
          undo: () => restoreBills(removed),
        });
      },
    });
  };

  if (bills.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          No bills yet. Add your first bill to get started!
        </p>
      </div>
    );
  }

  // Clicking a card toggles selection; row actions live in the ⋯ menu.
  const renderBillCard = (bill: Bill) => {
    const isSelected = selectedIds.has(bill.id);
    return (
      <div
        key={bill.id}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={`Select bill from ${bill.provider_name}`}
        onClick={() => toggleSelected(bill.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleSelected(bill.id);
          }
        }}
        className={cn(
          "group relative cursor-pointer rounded-lg border p-3 transition-all hover:opacity-90",
          washClassFor(bill.category),
          isSelected && "ring-2 ring-primary",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <h4 className="min-w-0 flex-1 truncate text-sm font-semibold">
            {bill.provider_name}
          </h4>
          <p className="shrink-0 font-mono text-sm font-semibold tracking-tight">
            {formatCurrency(bill.amount)}
          </p>
          <CardActionsMenu
            label={`Actions for bill from ${bill.provider_name}`}
            actions={[
              {
                label: "Edit",
                icon: Pencil,
                onClick: () => setEditingBill(bill),
              },
              {
                label: "Delete",
                icon: Trash2,
                destructive: true,
                onClick: () => setDeletingBill(bill),
              },
            ]}
          />
        </div>
        <p
          className={cn(
            "mt-1 text-[11px] font-semibold",
            textClassFor(bill.category),
          )}
        >
          {bill.category}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {formatDate(bill.date)}
        </p>
        {bill.description && (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {bill.description}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters + exports */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search payee, note or category"
            aria-label="Search bills"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 pl-8"
          />
        </div>
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-40" aria-label="Filter by month">
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
          <SelectTrigger className="w-40" aria-label="Filter by category">
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
          <SelectTrigger className="w-48" aria-label="Sort bills">
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
                  exportBillsToCsv(bills);
                  toast("Exported bills as CSV");
                }}
              >
                <Download className="size-3.5" />
                CSV
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => {
                  exportBillsToExcel(bills);
                  toast("Exported bills as Excel");
                }}
              >
                <Download className="size-3.5" />
                Excel
              </button>
            </PopoverContent>
          </Popover>
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

      {filteredBills.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No bills match the selected filters.
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
                  {groupedBills[month].length}{" "}
                  {groupedBills[month].length === 1 ? "bill" : "bills"}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {groupedBills[month].map(renderBillCard)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBills.map(renderBillCard)}
        </div>
      )}

      <EditBillDialog
        bill={editingBill}
        onOpenChange={(open) => {
          if (!open) setEditingBill(null);
        }}
      />

      {/* Single delete confirmation */}
      <Dialog
        open={!!deletingBill}
        onOpenChange={(open) => {
          if (!open) setDeletingBill(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete bill?</DialogTitle>
          </DialogHeader>
          {deletingBill && (
            <p className="text-sm text-muted-foreground">
              This will permanently remove the{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(deletingBill.amount)}
              </span>{" "}
              bill from{" "}
              <span className="font-medium text-foreground">
                {deletingBill.provider_name}
              </span>
              .
            </p>
          )}
          {deleteMutation.error && (
            <p className="text-sm text-destructive">
              {deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : "Failed to delete bill"}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setDeletingBill(null)}
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
            <DialogTitle>Delete {selectedIds.size} bills?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove the{" "}
            <span className="font-medium text-foreground">
              {selectedIds.size}
            </span>{" "}
            selected {selectedIds.size === 1 ? "bill" : "bills"}. This cannot be
            undone.
          </p>
          {bulkDeleteMutation.error && (
            <p className="text-sm text-destructive">
              {bulkDeleteMutation.error instanceof Error
                ? bulkDeleteMutation.error.message
                : "Failed to delete bills"}
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
