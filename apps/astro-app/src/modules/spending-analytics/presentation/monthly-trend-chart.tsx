"use client";

import { formatCurrency, formatMonth } from "@/shared/format";
import type { MonthlyTotal } from "../core/analytics";

interface MonthlyTrendChartProps {
  months: MonthlyTotal[];
}

const CHART_HEIGHT = 180;
const BAR_GAP = 8;
const LABEL_SPACE = 22;

/**
 * Single-series bar chart of month totals. Identity is carried by the axis
 * labels and tooltips; color is the theme's primary hue only.
 */
export function MonthlyTrendChart({ months }: MonthlyTrendChartProps) {
  const data = months.slice(-12);
  if (data.length === 0) return null;

  const max = Math.max(...data.map((m) => m.total));
  const maxIndex = data.findIndex((m) => m.total === max);
  const gridLines = [0.25, 0.5, 0.75];

  return (
    <div className="overflow-x-auto">
      <svg
        role="img"
        aria-label={`Monthly spending, ${formatMonth(data[0].month)} to ${formatMonth(data[data.length - 1].month)}`}
        viewBox={`0 0 640 ${CHART_HEIGHT + LABEL_SPACE}`}
        className="min-w-[480px] w-full"
      >
        {/* Recessive grid */}
        {gridLines.map((fraction) => (
          <line
            key={fraction}
            x1="0"
            x2="640"
            y1={CHART_HEIGHT * fraction}
            y2={CHART_HEIGHT * fraction}
            className="stroke-border"
            strokeWidth="1"
            strokeDasharray="2 4"
          />
        ))}
        <line
          x1="0"
          x2="640"
          y1={CHART_HEIGHT}
          y2={CHART_HEIGHT}
          className="stroke-border"
          strokeWidth="1"
        />

        {data.map((month, index) => {
          const slot = 640 / data.length;
          const barWidth = Math.min(48, slot - BAR_GAP);
          const x = index * slot + (slot - barWidth) / 2;
          const height =
            max > 0
              ? Math.max((month.total / max) * (CHART_HEIGHT - 24), 2)
              : 2;
          const y = CHART_HEIGHT - height;
          const isMax = index === maxIndex;

          return (
            <g key={month.month} className="group">
              <title>{`${formatMonth(month.month)}: ${formatCurrency(month.total)}`}</title>
              {/* Oversized invisible hit target */}
              <rect
                x={index * slot}
                y="0"
                width={slot}
                height={CHART_HEIGHT}
                fill="transparent"
              />
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={height}
                rx="4"
                className="fill-primary transition-opacity group-hover:opacity-80"
              />
              {/* Direct label on the peak month only; others reveal on hover */}
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                className={
                  isMax
                    ? "fill-foreground text-[11px] font-medium"
                    : "fill-foreground text-[11px] font-medium opacity-0 transition-opacity group-hover:opacity-100"
                }
              >
                {formatCurrency(month.total)}
              </text>
              <text
                x={x + barWidth / 2}
                y={CHART_HEIGHT + 15}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {formatMonth(month.month)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
