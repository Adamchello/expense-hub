"use client";

import { cn } from "@/lib/utils";
import { useCategoryOptions } from "@/modules/category-management/core/use-category-options";

/**
 * The one category chip. Previously spelled three different ways across the
 * app (bordered pill, square chip, bare coloured text) from the same colour
 * source — this is the single spelling.
 */
interface CategoryBadgeProps {
  category: string;
  /** Trailing detail rendered inside the chip's row, e.g. "· Monthly". */
  suffix?: string;
  /** Override the colour classes when the caller already resolved them. */
  colorClassName?: string;
  className?: string;
}

export function CategoryBadge({
  category,
  suffix,
  colorClassName,
  className,
}: CategoryBadgeProps) {
  const { badgeClassFor } = useCategoryOptions();

  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
          colorClassName ?? badgeClassFor(category),
        )}
      >
        {category}
      </span>
      {suffix && (
        <span className="text-xs text-muted-foreground">{suffix}</span>
      )}
    </span>
  );
}
