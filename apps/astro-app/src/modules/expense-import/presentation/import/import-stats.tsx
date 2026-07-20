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
        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
        <span>{total} total rows</span>
      </div>
      <div className="flex items-center gap-2">
        <Check className="h-4 w-4 text-green-600" />
        <span className="text-green-600">{valid} ready to import</span>
      </div>
      {errors > 0 && (
        <div
          data-e2e="expense-import.stats.errors"
          className="flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-destructive">{errors} with errors</span>
        </div>
      )}
      {duplicates > 0 && (
        <div
          data-e2e="expense-import.stats.duplicates"
          className="flex items-center gap-2"
        >
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-yellow-600">
            {duplicates} potential duplicates
          </span>
        </div>
      )}
    </div>
  );
}
