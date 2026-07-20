export interface ParsedDate {
  value: string | null;
  error: string | null;
}

export function parseDate(value: string, allowFuture = false): ParsedDate {
  if (!value || value.trim() === "") {
    return { value: null, error: "Date is required" };
  }

  const cleaned = value.trim();
  let parsedDate: Date | null = null;

  // ISO format: YYYY-MM-DD
  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // MM/DD/YYYY format
  if (!parsedDate) {
    const usMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (usMatch) {
      const [, month, day, year] = usMatch;
      parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  }

  // MM/DD/YY format
  if (!parsedDate) {
    const usShortMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
    if (usShortMatch) {
      const [, month, day, shortYear] = usShortMatch;
      const year = parseInt(shortYear) + 2000;
      parsedDate = new Date(year, parseInt(month) - 1, parseInt(day));
    }
  }

  // DD.MM.YYYY format
  if (!parsedDate) {
    const euMatch = cleaned.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (euMatch) {
      const [, day, month, year] = euMatch;
      parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  }

  // DD-MM-YYYY format
  if (!parsedDate) {
    const euDashMatch = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (euDashMatch) {
      const [, day, month, year] = euDashMatch;
      parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  }

  // Fallback: native Date parsing
  if (!parsedDate) {
    const fallback = new Date(cleaned);
    if (!isNaN(fallback.getTime())) {
      parsedDate = fallback;
    }
  }

  if (!parsedDate || isNaN(parsedDate.getTime())) {
    return { value: null, error: "Invalid date format" };
  }

  if (!allowFuture) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (parsedDate > today) {
      return { value: null, error: "Date cannot be in the future" };
    }
  }

  const formattedDate = parsedDate.toISOString().split("T")[0];
  return { value: formattedDate, error: null };
}
