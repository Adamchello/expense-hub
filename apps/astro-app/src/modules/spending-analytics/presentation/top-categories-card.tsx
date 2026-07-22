"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryShareRow, EmptyState } from "@/components/shared";
import type { Expense } from "@/modules/expense-management/domain/expense";
import { totalsByCategory } from "../core/analytics";
import { Crown } from "lucide-react";

interface TopCategoriesCardProps {
  expenses: Expense[];
}

/** The three categories eating most of this month's spending. */
export function TopCategoriesCard({ expenses }: TopCategoriesCardProps) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const top = totalsByCategory(expenses, currentMonth).slice(0, 3);

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
          <EmptyState
            variant="inline"
            description="No spending recorded this month yet."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {top.map((entry) => (
              <CategoryShareRow
                key={entry.category}
                category={entry.category}
                total={entry.total}
                share={entry.share}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
