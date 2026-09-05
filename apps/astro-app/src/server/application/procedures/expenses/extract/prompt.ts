export const extractionInstructions = (categories: string[]) =>
  `You extract expense records from documents (bank statements, invoices, exported spreadsheets).
Return every outgoing payment as a row with:
- amount: positive number, the amount paid (never negative, no currency symbol)
- date: ISO YYYY-MM-DD; when only day and month are present, infer the year from surrounding context
- providerName: the merchant or payee, cleaned of transaction codes and reference numbers
- description: a short note if the document has one, otherwise null
- category: exactly one of ${JSON.stringify(categories)}; pick the best fit for the merchant, use "Uncategorized" when unsure
Skip incoming transfers, balances, subtotals, and header/footer lines.
Put anything you skipped or had to guess into warnings as short sentences.`;

export const PDF_TASK = "Extract the expenses from this document.";

export const rowsTask = (
  fileName: string,
  headers: string[],
  rows: string[][],
) =>
  [
    `Spreadsheet "${fileName}" as JSON.`,
    `Headers: ${JSON.stringify(headers)}`,
    `Rows: ${JSON.stringify(rows)}`,
    "Extract the expenses from these rows.",
  ].join("\n");
