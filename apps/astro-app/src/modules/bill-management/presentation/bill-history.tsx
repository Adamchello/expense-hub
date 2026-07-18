"use client";

import { useMemo, useState } from "react";
import type { Bill } from "../domain/bill";
import { Button } from "@/components/ui/button";
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
import { getCategoryColor } from "@/shared/configuration/category";
import { formatCurrency, formatDate, formatMonth } from "@/shared/format";
import { useDeleteBill } from "../core/store";
import { exportBillsToCsv, exportBillsToExcel } from "../core/export";
import { EditBillDialog } from "./edit-bill-dialog";
import { Download, Pencil, Trash2 } from "lucide-react";

const ALL = "all";

interface BillHistoryProps {
  bills: Bill[];
  onRefresh?: () => void;
}

export function BillHistory({ bills, onRefresh }: BillHistoryProps) {
  const [monthFilter, setMonthFilter] = useState<string>(ALL);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [deletingBill, setDeletingBill] = useState<Bill | null>(null);

  const deleteMutation = useDeleteBill();

  const monthOptions = useMemo(() => {
    const months = new Set(bills.map((bill) => bill.date.slice(0, 7)));
    return [...months].sort((a, b) => b.localeCompare(a));
  }, [bills]);

  const categoryOptions = useMemo(() => {
    const categories = new Set(bills.map((bill) => bill.category));
    return [...categories].sort();
  }, [bills]);

  const filteredBills = useMemo(
    () =>
      bills.filter(
        (bill) =>
          (monthFilter === ALL || bill.date.startsWith(monthFilter)) &&
          (categoryFilter === ALL || bill.category === categoryFilter),
      ),
    [bills, monthFilter, categoryFilter],
  );

  // Group bills by date
  const groupedBills = useMemo(() => {
    const groups: Record<string, Bill[]> = {};
    filteredBills.forEach((bill) => {
      const dateKey = bill.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(bill);
    });
    return groups;
  }, [filteredBills]);

  const sortedDates = Object.keys(groupedBills).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  const handleConfirmDelete = () => {
    if (!deletingBill) return;
    deleteMutation.mutate(deletingBill.id, {
      onSuccess: () => setDeletingBill(null),
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold">Bill History</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportBillsToCsv(bills)}
          >
            <Download className="size-3.5" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportBillsToExcel(bills)}
          >
            <Download className="size-3.5" />
            Excel
          </Button>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-44" aria-label="Filter by month">
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
          <SelectTrigger className="w-44" aria-label="Filter by category">
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

        {(monthFilter !== ALL || categoryFilter !== ALL) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setMonthFilter(ALL);
              setCategoryFilter(ALL);
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {filteredBills.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No bills match the selected filters.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {formatDate(date)}
                </h3>
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  {groupedBills[date].length}{" "}
                  {groupedBills[date].length === 1 ? "bill" : "bills"}
                </span>
              </div>

              <div className="space-y-2">
                {groupedBills[date].map((bill) => (
                  <div
                    key={bill.id}
                    className="group rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium">{bill.provider_name}</h4>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getCategoryColor(bill.category)}`}
                          >
                            {bill.category}
                          </span>
                        </div>
                        {bill.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {bill.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <p className="text-lg font-semibold">
                          {formatCurrency(bill.amount)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit bill from ${bill.provider_name}`}
                          onClick={() => setEditingBill(bill)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete bill from ${bill.provider_name}`}
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setDeletingBill(bill)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <EditBillDialog
        bill={editingBill}
        onOpenChange={(open) => {
          if (!open) setEditingBill(null);
        }}
      />

      {/* Delete confirmation */}
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
    </div>
  );
}
