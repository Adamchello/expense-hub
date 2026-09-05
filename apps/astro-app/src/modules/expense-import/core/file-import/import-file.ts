import type {
  ParseResult,
  ProcessingPhase,
  SpreadsheetGrid,
} from "../../domain/expense-import";
import { EXTRACT_ROWS_CAP } from "@/shared/server-contracts/schemas/expense";
import { extractExpenses } from "../../integration/repository";
import {
  isPdf,
  readGrid,
  readFileAsBase64,
} from "../../integration/file-parsers";
import { detectColumns } from "./column-detection";
import { parseRow } from "./row-parser";
import { rowsFromExtracted } from "./extracted-mapper";

type ImportOptions = {
  onPhase?: (phase: ProcessingPhase) => void;
  /** Aborts the model request; the caller decides what to do with the result. */
  signal?: AbortSignal;
};

const failure = (errors: string[]): ParseResult => ({
  success: false,
  errors,
});

const errorMessageOf = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";

async function extractWithModel(
  input: Parameters<typeof extractExpenses>[0],
  { onPhase, signal }: ImportOptions,
): Promise<ParseResult> {
  onPhase?.("extracting");
  try {
    const result = await extractExpenses(input, signal);
    return {
      success: true,
      rows: rowsFromExtracted(result.rows),
      warnings: result.warnings,
    };
  } catch (error) {
    return failure([`Could not read this file: ${errorMessageOf(error)}`]);
  }
}

async function importGrid(
  file: File,
  grid: SpreadsheetGrid,
  options: ImportOptions,
): Promise<ParseResult> {
  const detection = detectColumns(grid.headers, grid.hasHeaders);

  if (detection.confident) {
    return {
      success: true,
      rows: grid.rows.map((row) => parseRow(row, detection.columns)),
      warnings: [],
    };
  }

  const result = await extractWithModel(
    {
      kind: "rows",
      fileName: file.name,
      headers: grid.headers,
      rows: grid.rows.slice(0, EXTRACT_ROWS_CAP),
    },
    options,
  );

  if (result.success && grid.rows.length > EXTRACT_ROWS_CAP) {
    return {
      ...result,
      warnings: [
        `Only the first ${EXTRACT_ROWS_CAP} rows were read. Split the file to import the rest.`,
        ...result.warnings,
      ],
    };
  }

  return result;
}

/**
 * File → review rows. This is the policy: spreadsheets with recognizable
 * headers never leave the browser; unrecognized spreadsheets and PDFs go to
 * the model. Readers and the API call live in integration.
 */
export async function importFile(
  file: File,
  options: ImportOptions = {},
): Promise<ParseResult> {
  options.onPhase?.("parsing");

  if (isPdf(file)) {
    let base64: string;
    try {
      base64 = await readFileAsBase64(file);
    } catch (error) {
      return failure([errorMessageOf(error)]);
    }
    return extractWithModel(
      { kind: "pdf", fileName: file.name, base64 },
      options,
    );
  }

  const gridResult = await readGrid(file);
  if (!gridResult.success) return failure(gridResult.errors);

  return importGrid(file, gridResult.grid, options);
}
