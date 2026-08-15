"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Amount, HillsArt, PlantArt, TrendDelta } from "@/components/shared";
import { cn } from "@/lib/utils";

/**
 * A period's total, given the most room on the page.
 *
 * One figure per card, at a size nothing else competes with, with the change
 * against the previous period directly under it — the amount says where you
 * are, the delta says which way you are moving. Nothing else.
 *
 * A strip counting the expenses behind the figure used to close the card. It
 * was dropped: how many receipts make up a total is bookkeeping, not a thing
 * anyone acts on, and it competed with the number it was supposed to support.
 *
 * The illustration is decoration and sits behind the content at low opacity;
 * the text column is capped so the number never runs into it.
 */
interface SpendingHeroCardProps {
  label: string;
  total: number;
  /** Percent change vs the previous comparable period; null when there is none. */
  changePct: number | null;
  /** The period being compared to, e.g. "Apr 2025". */
  comparisonLabel: string;
  art: "hills" | "plant";
  className?: string;
}

const ART: Record<SpendingHeroCardProps["art"], ReactNode> = {
  hills: (
    // The fill reaches the SVG's own left edge, which cut a hard vertical
    // seam across the card. The mask dissolves it into the surface instead.
    <HillsArt className="absolute bottom-0 right-0 h-24 w-52 [mask-image:linear-gradient(to_right,transparent,#000_45%)] sm:h-28 sm:w-72" />
  ),
  plant: (
    <PlantArt className="absolute bottom-0 right-3 h-[85%] w-28 sm:right-5 sm:w-36" />
  ),
};

export function SpendingHeroCard({
  label,
  total,
  changePct,
  comparisonLabel,
  art,
  className,
}: SpendingHeroCardProps) {
  return (
    <Card className={cn("gap-0 overflow-hidden py-0", className)}>
      <div className="relative flex min-h-36 flex-col justify-center px-5 py-6 sm:min-h-40 sm:px-6">
        {/* The illustration is the first thing to go when space runs out.
            Below `xs` there is no width for both a six-figure total and a
            decoration, and the total is why anyone opened the card. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden min-[360px]:block"
        >
          {ART[art]}
        </div>

        {/* Padding, not a percentage cap. `max-w-[62%]` resolved to 154px at
            320px wide while "$12,306.29" renders 173px, so the number
            overflowed onto the illustration it was supposed to be kept clear
            of — a percentage knows nothing about the font's advance width.
            Reserving the art's actual width means the text column can only
            ever be what is genuinely left, and below `xs` there is no art to
            reserve for. */}
        <div className="relative min-[360px]:pr-24 sm:pr-40">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            <Amount value={total} size="inherit" />
          </p>
          <TrendDelta
            className="mt-1.5"
            changePct={changePct}
            comparisonLabel={comparisonLabel}
            emptyLabel={`No ${comparisonLabel} spending to compare against`}
          />
        </div>
      </div>
    </Card>
  );
}
