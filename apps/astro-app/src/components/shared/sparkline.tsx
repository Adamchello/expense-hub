import { cn } from "@/lib/utils";
import { useId } from "react";

/**
 * A trend as a line, no axes and no numbers.
 *
 * Deliberately tiny and unlabelled: it sits beside a figure that already says
 * the amount, so its only job is the shape of the movement. The figure carries
 * the value, the line carries the direction — neither repeats the other.
 *
 * Draws nothing below two points. One point is not a trend, and a flat stub
 * would imply a steadiness the data has not earned.
 */
interface SparklineProps {
  values: number[];
  /** Solid color for the stroke; the fill is derived from it. */
  color: string;
  /** What the line is of, for the accessible description. */
  label: string;
  className?: string;
}

const VIEW_WIDTH = 100;
const VIEW_HEIGHT = 32;
const PADDING = 3;

export function Sparkline({ values, color, label, className }: SparklineProps) {
  const gradientId = useId();

  // Not `null`. Returning nothing left a hole in a tile whose siblings had a
  // chart, and a blank slot beside four identical boxes reads as "the chart
  // failed to load", not "there wasn't enough data". A flat rule occupies the
  // slot and says the honest thing: no trend to draw.
  if (values.length < 2) {
    return (
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${label}: too few spending days to show a trend`}
        className={cn("h-8 w-full", className)}
      >
        <line
          x1="0"
          y1={VIEW_HEIGHT / 2}
          x2={VIEW_WIDTH}
          y2={VIEW_HEIGHT / 2}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="3 5"
          opacity="0.35"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const step = VIEW_WIDTH / (values.length - 1);
  const usableHeight = VIEW_HEIGHT - PADDING * 2;

  const points = values.map((value, index) => {
    const x = index * step;
    const y = VIEW_HEIGHT - PADDING - ((value - min) / span) * usableHeight;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const direction =
    values[values.length - 1] > values[0]
      ? "rising"
      : values[values.length - 1] < values[0]
        ? "falling"
        : "flat";

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`${label} trend: ${direction}`}
      className={cn("h-8 w-full", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`M0,${VIEW_HEIGHT} L${points.join(" L")} L${VIEW_WIDTH},${VIEW_HEIGHT} Z`}
        fill={`url(#${gradientId})`}
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        // The viewBox is stretched to fit its slot, which would stretch the
        // stroke with it; this keeps the line the same weight at any width.
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
