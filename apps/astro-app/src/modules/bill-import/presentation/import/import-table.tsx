"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import type { ParsedBillRow } from "../../domain/bill-import";
import type { Category } from "../../domain/bill-import";
import { useCategoryOptions } from "@/modules/category-management/core/use-category-options";

interface ImportTableProps {
  rows: ParsedBillRow[];
  onUpdateRow: (id: string, field: keyof ParsedBillRow, value: string) => void;
  onUpdateCategory: (id: string, category: Category) => void;
  onRemoveRow: (id: string) => void;
}

export function ImportTable({
  rows,
  onUpdateRow,
  onUpdateCategory,
  onRemoveRow,
}: ImportTableProps) {
  const { flat: allCategories, badgeClassFor } = useCategoryOptions();

  return (
    <div
      data-e2e="bill-import.table"
      className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto  overflow-x-auto"
    >
      <table className="w-full text-sm">
        <thead className="bg-muted sticky top-0">
          <tr>
            <th className="text-left p-3 font-medium">Amount</th>
            <th className="text-left p-3 font-medium">Date</th>
            <th className="text-left p-3 font-medium">Provider</th>
            <th className="text-left p-3 font-medium">Category</th>
            <th className="text-left p-3 font-medium w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr
              key={row.id}
              data-e2e={
                row.errors.length > 0
                  ? "bill-import.row.error"
                  : row.isDuplicate
                    ? "bill-import.row.duplicate"
                    : undefined
              }
              className={`
                ${row.errors.length > 0 ? "bg-destructive/5" : ""}
                ${row.isDuplicate ? "bg-yellow-50" : ""}
              `}
            >
              <td className="p-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.amount}
                  onChange={(e) =>
                    onUpdateRow(row.id, "amount", e.target.value)
                  }
                  className={`h-8 w-24 ${row.errors.some((e) => e.includes("Amount")) ? "border-destructive" : ""}`}
                />
              </td>
              <td className="p-2">
                <Input
                  type="date"
                  value={row.date}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => onUpdateRow(row.id, "date", e.target.value)}
                  className={`h-8 w-36 ${row.errors.some((e) => e.includes("Date") || e.includes("date")) ? "border-destructive" : ""}`}
                />
              </td>
              <td className="p-2">
                <Input
                  type="text"
                  value={row.providerName}
                  onChange={(e) =>
                    onUpdateRow(row.id, "providerName", e.target.value)
                  }
                  className={`h-8 w-40 ${row.errors.some((e) => e.includes("Provider")) ? "border-destructive" : ""}`}
                />
              </td>
              <td className="p-2">
                <Select
                  value={row.category}
                  onValueChange={(value) =>
                    onUpdateCategory(row.id, value as Category)
                  }
                >
                  <SelectTrigger className="h-8 w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${badgeClassFor(cat)}`}
                        >
                          {cat}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="p-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onRemoveRow(row.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
