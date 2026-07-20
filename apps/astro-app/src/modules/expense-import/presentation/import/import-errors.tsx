"use client";

import type { ParsedExpenseRow } from "../../domain/expense-import";

interface ImportErrorsProps {
  rows: ParsedExpenseRow[];
}

export function ImportErrors({ rows }: ImportErrorsProps) {
  const problemRows = rows.filter(
    (row) => row.errors.length > 0 || row.isDuplicate,
  );

  if (problemRows.length === 0) return null;

  return (
    <div className="space-y-2">
      {problemRows.slice(0, 5).map((row) => (
        <div
          key={row.id}
          className={`text-xs p-2 rounded ${
            row.errors.length > 0
              ? "bg-destructive/10 text-destructive"
              : "bg-yellow-50 text-yellow-700"
          }`}
        >
          <span className="font-medium">{row.providerName || "Unknown"}:</span>{" "}
          {row.errors.length > 0
            ? row.errors.join(", ")
            : `Potential duplicate of: ${row.duplicateOf}`}
        </div>
      ))}
    </div>
  );
}
