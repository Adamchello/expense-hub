"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/shared/configuration/category";
import type { Category } from "../../domain/bill-import";
import { CopyX, Tags, Trash2 } from "lucide-react";

interface BulkActionsProps {
  errorCount: number;
  duplicateCount: number;
  onRemoveErrorRows: () => void;
  onRemoveDuplicateRows: () => void;
  onSetCategoryForAll: (category: Category) => void;
}

/** Bulk edits applied to every row of the import preview at once. */
export function BulkActions({
  errorCount,
  duplicateCount,
  onRemoveErrorRows,
  onRemoveDuplicateRows,
  onSetCategoryForAll,
}: BulkActionsProps) {
  return (
    <div
      data-e2e="bill-import.bulk-actions"
      className="flex flex-wrap items-center gap-2"
    >
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Bulk edit
      </span>

      <Select
        // Uncontrolled on purpose: this select is an action trigger, not a value holder.
        value=""
        onValueChange={(value) => onSetCategoryForAll(value as Category)}
      >
        <SelectTrigger
          size="sm"
          className="w-48"
          aria-label="Set category for all rows"
        >
          <Tags className="size-3.5" />
          <SelectValue placeholder="Set category for all" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {errorCount > 0 && (
        <Button
          data-e2e="bill-import.bulk-actions.remove-errors"
          variant="outline"
          size="sm"
          onClick={onRemoveErrorRows}
        >
          <Trash2 className="size-3.5" />
          Remove {errorCount} error {errorCount === 1 ? "row" : "rows"}
        </Button>
      )}

      {duplicateCount > 0 && (
        <Button
          data-e2e="bill-import.bulk-actions.remove-duplicates"
          variant="outline"
          size="sm"
          onClick={onRemoveDuplicateRows}
        >
          <CopyX className="size-3.5" />
          Remove {duplicateCount}{" "}
          {duplicateCount === 1 ? "duplicate" : "duplicates"}
        </Button>
      )}
    </div>
  );
}
