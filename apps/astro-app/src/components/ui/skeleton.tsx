import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} />;
}

/** One StatCard's silhouette: no icon tile, just label / value / hint stacked
 * on the same `rounded-xl` + ring surface the real `Card` uses. */
function SkeletonStatCard() {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-card px-5 py-5 ring-1 ring-foreground/10">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-2.5 w-28" />
    </div>
  );
}

/** Placeholder for the analytics tab: stat row + chart block, so the
 * skeleton previews the real layout instead of expense rows. */
export function SkeletonAnalytics() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {Array.from({ length: 3 }, (_, index) => (
          <SkeletonStatCard key={index} />
        ))}
      </div>
      <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-48 w-full" />
      </div>
    </div>
  );
}

/** Placeholder for the dashboard tab: a stat row over a card block, matching
 * the overview's layout rather than a list of rows. */
export function SkeletonDashboard() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonStatCard key={index} />
        ))}
      </div>
      <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-32 w-full" />
      </div>
    </div>
  );
}

/** Placeholder list shown while expense-like data loads. */
export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
        >
          <Skeleton className="size-9 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}
