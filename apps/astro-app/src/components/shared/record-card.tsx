"use client";

import { Amount } from "./amount";
import { CategoryBadge } from "./category-badge";
import {
  CardActionsMenu,
  type CardAction,
} from "@/components/ui/card-actions-menu";
import { cn } from "@/lib/utils";
import { useCategoryOptions } from "@/modules/category-management/core/use-category-options";
import type { DataE2E } from "@/__e2e__/data-e2e";

/**
 * One paid (or scheduled) thing: who, how much, what kind, when.
 *
 * Sits on a category-tinted wash so a list can be scanned by colour. Meta text
 * is a transparency of the ink rather than the grey token — grey on a tinted
 * surface goes muddy, a translucent ink stays in the wash's own hue.
 */
interface RecordCardProps {
  name: string;
  amount: number;
  category: string;
  /** Trailing note on the category chip, e.g. "· Monthly". */
  categorySuffix?: string;
  /** The when: a formatted date or a phrase like "Next payment Jul 21". */
  meta: string;
  note?: string | null;
  actions?: CardAction[];
  actionsLabel?: string;
  /** Turns the card into a selectable control. */
  onToggle?: () => void;
  selected?: boolean;
  selectLabel?: string;
  metaTestId?: DataE2E;
}

export function RecordCard({
  name,
  amount,
  category,
  categorySuffix,
  meta,
  note,
  actions,
  actionsLabel,
  onToggle,
  selected = false,
  selectLabel,
  metaTestId,
}: RecordCardProps) {
  const { washClassFor } = useCategoryOptions();
  const isInteractive = !!onToggle;

  return (
    <div
      {...(isInteractive
        ? {
            role: "button",
            tabIndex: 0,
            "aria-pressed": selected,
            "aria-label": selectLabel,
            onClick: onToggle,
            onKeyDown: (event: React.KeyboardEvent) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onToggle();
              }
            },
          }
        : {})}
      className={cn(
        "group relative rounded-xl border p-3.5 transition-colors",
        washClassFor(category),
        isInteractive &&
          "cursor-pointer hover:brightness-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected && "ring-2 ring-primary",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
          {name}
        </h4>
        <Amount value={amount} size="md" />
        {actions && actions.length > 0 && (
          <CardActionsMenu
            label={actionsLabel ?? `Actions for ${name}`}
            actions={actions}
          />
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <CategoryBadge category={category} suffix={categorySuffix} />
        <span className="text-xs text-foreground/65" data-e2e={metaTestId}>
          {meta}
        </span>
      </div>

      {note && (
        <p className="mt-1.5 truncate text-xs text-foreground/65">{note}</p>
      )}
    </div>
  );
}
