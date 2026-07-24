export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * "Jan–May 2025" when a span sits inside one year, "Nov 2024 – Feb 2025" when
 * it crosses one. Used by the comparison line on the headline cards, where
 * repeating the year twice inside a single year reads as noise.
 */
export function formatMonthRange(startKey: string, endKey: string): string {
  const startYear = startKey.slice(0, 4);
  const endYear = endKey.slice(0, 4);
  const start = formatMonth(startKey);
  const end = formatMonth(endKey);

  if (startKey === endKey) return end;
  if (startYear === endYear) {
    return `${start.replace(` ${startYear}`, "")}–${end}`;
  }
  return `${start} – ${end}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
