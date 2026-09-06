"use client";

import { Callout, errorMessage } from "@/libs/ui/callout";
import { SkeletonAnalytics } from "@/libs/ui/skeleton";
import { useExpenses } from "@/modules/expense-management/core/store";
import { SpendingAnalytics } from "@/modules/spending-analytics/presentation/spending-analytics";
import { PageTitle } from "./page-title";

export function AnalyticsPage() {
  const query = useExpenses();

  return (
    <div className="flex flex-col gap-4">
      <PageTitle>Spending analytics</PageTitle>
      {query.error && (
        <Callout variant="error">
          {errorMessage(query.error, "Failed to load expenses")}
        </Callout>
      )}
      {query.isLoading ? (
        <SkeletonAnalytics />
      ) : (
        <SpendingAnalytics expenses={query.data ?? []} />
      )}
    </div>
  );
}
