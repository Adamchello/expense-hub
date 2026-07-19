"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/shared/format";
import { cn } from "@/lib/utils";
import type { Bill } from "@/modules/bill-management/domain/bill";
import { useCategoryOptions } from "@/modules/category-management/core/use-category-options";
import { totalsByCategory } from "../core/analytics";
import { Crown } from "lucide-react";

interface TopCategoriesCardProps {
  bills: Bill[];
}

/** The three categories eating most of this month's spending. */
export function TopCategoriesCard({ bills }: TopCategoriesCardProps) {
  const { textClassFor, hexFor } = useCategoryOptions();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const top = totalsByCategory(bills, currentMonth).slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="size-4.5 text-primary" />
          Top Categories This Month
        </CardTitle>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No spending recorded this month yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {top.map((entry) => (
              <li key={entry.category}>
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      textClassFor(entry.category),
                    )}
                  >
                    {entry.category}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {formatCurrency(entry.total)} · {entry.share}%
                  </p>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${entry.share}%`,
                      backgroundColor: hexFor(entry.category),
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
