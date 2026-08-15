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

/** Placeholder for the analytics tab: stat row then two panel rows on the same
 * column template the real view uses, so nothing jumps when the data lands. */
export function SkeletonAnalytics() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6" aria-hidden="true">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {Array.from({ length: 3 }, (_, index) => (
          <SkeletonStatCard key={index} />
        ))}
      </div>
      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1.15fr_1fr]">
        <SkeletonChartPanel />
        <SkeletonChartPanel />
      </div>
      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1.15fr_1fr]">
        <SkeletonPanel rows={2} />
        <SkeletonPanel rows={2} />
      </div>
    </div>
  );
}

/** A titled panel whose body is one large chart block. */
function SkeletonChartPanel() {
  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-4 h-52 w-full" />
    </div>
  );
}

/** One headline card's silhouette: label, figure, comparison line. */
function SkeletonHeroCard() {
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="flex min-h-36 flex-col justify-center gap-2 px-5 py-6 sm:min-h-40 sm:px-6">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-3 w-36" />
      </div>
    </div>
  );
}

/** A titled card's body while its own query is in flight. */
export function SkeletonPanel({ rows = 4 }: { rows?: number }) {
  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <Skeleton className="h-4 w-40" />
      <div className="mt-4 flex flex-col gap-3">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}

/**
 * Placeholder for the dashboard tab. Mirrors the real composition — greeting,
 * two headline cards, the paired panels, the category tiles — so the page
 * fills in rather than being replaced when the data lands.
 */
export function SkeletonDashboard() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* The silhouette itself is decoration and stays hidden, but something
          has to say the page is loading — and then say it finished. Without
          this the whole load is silent to a screen reader. */}
      <p role="status" aria-live="polite" className="sr-only">
        Loading your dashboard
      </p>
      <div className="flex flex-col gap-4 sm:gap-6" aria-hidden="true">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-3.5 w-64" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <SkeletonHeroCard key={index} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <SkeletonPanel rows={5} />
          <SkeletonPanel rows={5} />
        </div>

        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <Skeleton className="h-4 w-48" />
          {/* Tracks `TopCategoriesCard` exactly — four tiles, and the same
              breakpoints. It was three at `lg:grid-cols-3`, so the layout
              visibly reflowed the moment the data landed. */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-32 w-full" />
            ))}
          </div>
        </div>
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
