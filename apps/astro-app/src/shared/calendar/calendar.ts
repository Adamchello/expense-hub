/**
 * Calendar arithmetic on plain ISO strings (YYYY-MM, YYYY-MM-DD).
 *
 * Strings rather than Date objects on purpose: every date this product stores
 * is a calendar day, not an instant, and the moment one becomes a `Date` it
 * acquires a timezone it never had. Comparison is `localeCompare`, and the
 * only arithmetic goes through here — always in UTC.
 */

/** First and last day (YYYY-MM-DD) of a YYYY-MM month. */
export function monthBounds(month: string): { from: string; to: string } {
  const [year, m] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, m, 0)).getUTCDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

/** Shifts a YYYY-MM month by a number of months. */
export function shiftMonth(month: string, offset: number): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1 + offset, 1)).toISOString().slice(0, 7);
}

/** Adds days to a YYYY-MM-DD date. */
export function addDays(date: string, days: number): string {
  const [year, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Number of days in a YYYY-MM month. */
export function daysInMonth(month: string): number {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m, 0)).getUTCDate();
}

/** Monday-first column index (0-6) the 1st of a YYYY-MM month falls on. */
export function leadingBlanks(month: string): number {
  const [year, m] = month.split("-").map(Number);
  return (new Date(Date.UTC(year, m - 1, 1)).getUTCDay() + 6) % 7;
}

/** Today as YYYY-MM-DD, in the reader's own calendar. */
export function todayIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    .toISOString()
    .slice(0, 10);
}
