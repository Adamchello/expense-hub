export const FREQUENCIES = [
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
] as const;

export type Frequency = (typeof FREQUENCIES)[number];

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

/** Adds months, clamping to the last day of the target month (Jan 31 + 1mo = Feb 28). */
function addMonthsClamped(
  year: number,
  month: number,
  day: number,
  months: number,
) {
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}

/** Advances a YYYY-MM-DD date by one occurrence of the given frequency. */
export function advanceDueDate(date: string, frequency: Frequency): string {
  const [year, month, day] = date.split("-").map(Number);
  let utc: Date;

  switch (frequency) {
    case "weekly":
      utc = new Date(Date.UTC(year, month - 1, day + 7));
      break;
    case "monthly":
      utc = addMonthsClamped(year, month, day, 1);
      break;
    case "quarterly":
      utc = addMonthsClamped(year, month, day, 3);
      break;
    case "yearly":
      utc = addMonthsClamped(year, month, day, 12);
      break;
  }

  return utc.toISOString().slice(0, 10);
}

/** Whole days from `from` (YYYY-MM-DD) until `to` (YYYY-MM-DD); negative = overdue. */
export function daysUntil(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const ms = Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd);
  return Math.round(ms / 86_400_000);
}
