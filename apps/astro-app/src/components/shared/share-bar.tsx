"use client";

import { Amount } from "./amount";
import { CategoryBadge } from "./category-badge";
import { cn } from "@/libs/ui/utils";
import { useCategoryOptions } from "@/modules/category-management/core/use-category-options";

/**
 * How big a slice is, as a bar.
 *
 * Presentational, and deliberately so. It used to carry `role="progressbar"`
 * with `aria-valuenow`, which announced "Rent, 61.3% of spending, progress bar,
 * 61 percent" — a static proportion described as a task in flight, then said
 * again by the percentage label sitting right beside it. A share is not
 * progress. The number is already in the text; the bar only draws it.
 */
interface ShareBarProps {
  /** 0–100. */
  share: number;
  color: string;
  /** Kept for callers; used only if a bar is ever rendered without a label. */
  label: string;
  className?: string;
}

export function ShareBar({ share, color, className }: ShareBarProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-foreground/10",
        className,
      )}
    >
      {/* Width eases when the period or filter changes, so a bar re-reads as
          the same bar moving rather than a new one appearing. Inside the
          product's 150–250ms budget; it was 500ms, which is choreography. */}
      <div
        className="h-full rounded-full transition-[width] duration-200 ease-out-quart"
        style={{ width: `${share}%`, backgroundColor: color }}
      />
    </div>
  );
}

/**
 * A category, what it cost, and its share — the row used by both the
 * "Top categories" card and the analytics distribution legend, which were
 * byte-identical apart from one margin.
 */
interface CategoryShareRowProps {
  category: string;
  total: number;
  share: number;
}

export function CategoryShareRow({
  category,
  total,
  share,
}: CategoryShareRowProps) {
  const { hexFor } = useCategoryOptions();

  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <CategoryBadge category={category} />
        <span className="shrink-0 text-xs text-muted-foreground">
          <Amount value={total} size="sm" weight="normal" muted /> · {share}%
        </span>
      </div>
      <ShareBar share={share} color={hexFor(category)} label={category} />
    </li>
  );
}
