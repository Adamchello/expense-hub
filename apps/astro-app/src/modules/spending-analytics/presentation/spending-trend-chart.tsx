"use client";

import { formatCurrency, formatCurrencyRounded } from "@/shared/format";

export interface TrendPoint {
  /** Stable identity for the bar, e.g. "2026-07" or "2026". */
  key: string;
  /** What the axis calls it, e.g. "Jul" or "2026". */
  label: string;
  total: number;
}

interface SpendingTrendChartProps {
  points: TrendPoint[];
  /** Names the whole chart for screen readers, e.g. "Monthly spending in 2026". */
  ariaLabel: string;
}

const CHART_WIDTH = 640;
/** Gutter for the value axis; the labels are right-aligned inside it. */
const AXIS_WIDTH = 46;
const PLOT_HEIGHT = 190;
/** Headroom so the label above the tallest bar never clips. */
const TOP_PAD = 16;
const LABEL_SPACE = 20;
const BAR_GAP = 10;
const MAX_BAR_WIDTH = 44;
const TICKS = 4;

const BASELINE = TOP_PAD + PLOT_HEIGHT;

/**
 * The smallest "round" number at or above `value`, so the axis tops out at $600
 * rather than $422.98 and the four ticks below it land on readable figures.
 */
function niceCeiling(value: number): number {
  if (value <= 0) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8]) {
    if (value <= step * magnitude) return step * magnitude;
  }
  return 10 * magnitude;
}

/**
 * Single-series bar chart of spending per period. Identity is carried by the
 * axis labels and tooltips; colour is the theme's primary hue only.
 *
 * Periods with no spending draw no bar at all. A 2px stub for a zero month
 * reads as "a little was spent", which is a different claim from "nothing was".
 */
export function SpendingTrendChart({
  points,
  ariaLabel,
}: SpendingTrendChartProps) {
  const data = points.slice(-12);
  if (data.length === 0) return null;

  const peak = Math.max(...data.map((point) => point.total));
  const axisMax = niceCeiling(peak);
  const peakIndex = data.findIndex((point) => point.total === peak);
  const slot = (CHART_WIDTH - AXIS_WIDTH) / data.length;
  const barWidth = Math.min(MAX_BAR_WIDTH, slot - BAR_GAP);

  return (
    <div className="overflow-x-auto">
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox={`0 0 ${CHART_WIDTH} ${BASELINE + LABEL_SPACE}`}
        className="w-full min-w-[520px]"
      >
        {/* Value axis: a solid baseline, dashed rules above it. */}
        {Array.from({ length: TICKS + 1 }, (_, tick) => {
          const fraction = tick / TICKS;
          const y = BASELINE - fraction * PLOT_HEIGHT;
          const isBaseline = tick === 0;
          return (
            <g key={tick}>
              <line
                x1={AXIS_WIDTH}
                x2={CHART_WIDTH}
                y1={y}
                y2={y}
                className="stroke-border"
                strokeWidth="1"
                strokeDasharray={isBaseline ? undefined : "2 4"}
              />
              <text
                x={AXIS_WIDTH - 10}
                y={y + 3.5}
                textAnchor="end"
                className="fill-muted-foreground text-[10px] tabular-nums"
              >
                {formatCurrencyRounded(axisMax * fraction)}
              </text>
            </g>
          );
        })}

        {data.map((point, index) => {
          const height =
            axisMax > 0 ? (point.total / axisMax) * PLOT_HEIGHT : 0;
          const x = AXIS_WIDTH + index * slot + (slot - barWidth) / 2;
          const y = BASELINE - height;
          const isPeak = index === peakIndex && point.total > 0;

          return (
            <g key={point.key} className="group">
              <title>{`${point.label}: ${formatCurrency(point.total)}`}</title>
              {/* Oversized invisible hit target, so hovering anywhere in the
                  column reveals that period's figure. */}
              <rect
                x={AXIS_WIDTH + index * slot}
                y={TOP_PAD}
                width={slot}
                height={PLOT_HEIGHT}
                fill="transparent"
              />
              {point.total > 0 && (
                <>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={height}
                    rx="5"
                    className="fill-primary transition-opacity group-hover:opacity-80"
                  />
                  {/* Direct label on the peak only; the rest reveal on hover. */}
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    className={
                      isPeak
                        ? "fill-foreground text-[11px] font-medium tabular-nums"
                        : "fill-foreground text-[11px] font-medium tabular-nums opacity-0 transition-opacity group-hover:opacity-100"
                    }
                  >
                    {formatCurrency(point.total)}
                  </text>
                </>
              )}
              <text
                x={x + barWidth / 2}
                y={BASELINE + 15}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
