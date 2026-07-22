"use client";

import { Callout } from "@/components/shared";
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
        <Callout
          key={row.id}
          variant={row.errors.length > 0 ? "error" : "warning"}
        >
          <span className="font-medium">{row.providerName || "Unknown"}:</span>{" "}
          {row.errors.length > 0
            ? row.errors.join(", ")
            : `Potential duplicate of: ${row.duplicateOf}`}
        </Callout>
      ))}
    </div>
  );
}
