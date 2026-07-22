"use client";

import { Amount } from "./amount";
import { CategoryBadge } from "./category-badge";
import { cn } from "@/lib/utils";
import { useCategoryOptions } from "@/modules/category-management/core/use-category-options";

/**
 * How big a slice is, as a bar. Carries `role="progressbar"` so the share is
 * announced rather than living only in the pixels.
 */
interface ShareBarProps {
  /** 0–100. */
  share: number;
  color: string;
  label: string;
  className?: string;
}

export function ShareBar({ share, color, label, className }: ShareBarProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(share)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label}: ${share}% of spending`}
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-foreground/10",
        className,
      )}
    >
      {/* Width eases when the period or filter changes, so a bar re-reads as
          the same bar moving rather than a new one appearing. */}
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out-quart"
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
