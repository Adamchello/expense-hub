"use client";

import {
  FileSpreadsheet,
  Check,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

interface ImportStatsProps {
  total: number;
  valid: number;
  errors: number;
  duplicates: number;
}

export function ImportStats({
  total,
  valid,
  errors,
  duplicates,
}: ImportStatsProps) {
  return (
    <div
      data-e2e="expense-import.stats"
      className="flex flex-wrap gap-4 text-sm"
    >
      <div className="flex items-center gap-2">
        <FileSpreadsheet className="size-4 text-muted-foreground" />
        <span>{total} total rows</span>
      </div>
      <div className="flex items-center gap-2">
        <Check className="size-4 text-success" />
        <span className="text-success">{valid} ready to import</span>
      </div>
      {errors > 0 && (
        <div
          data-e2e="expense-import.stats.errors"
          className="flex items-center gap-2"
        >
          <AlertCircle className="size-4 text-destructive" />
          <span className="text-destructive">{errors} with errors</span>
        </div>
      )}
      {duplicates > 0 && (
        <div
          data-e2e="expense-import.stats.duplicates"
          className="flex items-center gap-2"
        >
          <AlertTriangle className="size-4 text-warning" />
          <span className="text-warning">
            {duplicates} potential duplicates
          </span>
        </div>
      )}
    </div>
  );
}
