import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/libs/api/query-client";
import type {
  Category,
  ParsedExpenseRow,
  ProcessingPhase,
} from "../domain/expense-import";
import type { Expense } from "@/modules/expense-management/domain/expense";
import { importExpenses } from "../integration/repository";
import { importFile } from "./file-import/import-file";
import {
  validateImportFileType,
  validateFileSize,
} from "../configuration/validation";
import {
  checkDuplicates,
  updateRowField,
  categorizeRows,
} from "./import-processor";

export type ImportStep = "upload" | "review" | "importing";

interface ImportStatus {
  errors: string[];
  isProcessing: boolean;
  /** Which stage is running while `isProcessing`; drives the upload label. */
  phase: ProcessingPhase;
  successMessage: string | null;
}

const INITIAL_STATUS: ImportStatus = {
  errors: [],
  isProcessing: false,
  phase: "idle",
  successMessage: null,
};

const failed = (errors: string[]): ImportStatus => ({
  errors,
  isProcessing: false,
  phase: "idle",
  successMessage: null,
});

export function useImportExpenses() {
  return useMutation(
    {
      mutationFn: (expenses: ParsedExpenseRow[]) => importExpenses(expenses),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
      },
    },
    queryClient,
  );
}

export function useImportStore(existingExpenses: Expense[] | undefined) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [rows, setRows] = useState<ParsedExpenseRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [importStatus, setImportStatus] =
    useState<ImportStatus>(INITIAL_STATUS);
  /** In-flight file read; aborted on reset so a closed dialog never gets a late result. */
  const inFlight = useRef<AbortController | null>(null);

  const {
    mutate: mutateImportExpenses,
    error: importError,
    isPending: isImporting,
    reset: resetMutation,
  } = useImportExpenses();

  const resetState = useCallback(() => {
    inFlight.current?.abort();
    inFlight.current = null;
    setStep("upload");
    setRows([]);
    setWarnings([]);
    setImportStatus(INITIAL_STATUS);
    resetMutation();
  }, [resetMutation]);

  const processFile = useCallback(
    async (file: File) => {
      setImportStatus({
        errors: [],
        isProcessing: true,
        phase: "parsing",
        successMessage: null,
      });

      const typeValidation = validateImportFileType(file);
      if (!typeValidation.valid) {
        setImportStatus(failed([typeValidation.error!]));
        return;
      }

      const sizeValidation = validateFileSize(file);
      if (!sizeValidation.valid) {
        setImportStatus(failed([sizeValidation.error!]));
        return;
      }

      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;

      const result = await importFile(file, {
        signal: controller.signal,
        onPhase: (phase) =>
          setImportStatus((prev) => ({ ...prev, phase, isProcessing: true })),
      });

      // Reset (dialog closed) or a newer upload won this race: drop the result.
      if (controller.signal.aborted) return;
      inFlight.current = null;

      if (!result.success) {
        setImportStatus(failed(result.errors));
        return;
      }

      if (result.rows.length === 0) {
        setImportStatus(failed(["No valid expense data found."]));
        return;
      }

      let processedRows = categorizeRows(result.rows);
      if (existingExpenses) {
        processedRows = checkDuplicates(processedRows, existingExpenses);
      }

      setRows(processedRows);
      setWarnings(result.warnings);
      setStep("review");
      setImportStatus(INITIAL_STATUS);
    },
    [existingExpenses],
  );

  const updateRow = useCallback(
    (id: string, field: keyof ParsedExpenseRow, value: string) => {
      setRows((prev) =>
        prev.map((row) =>
          row.id === id ? updateRowField(row, field, value) : row,
        ),
      );
    },
    [],
  );

  const updateCategory = useCallback((id: string, category: Category) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, category } : row)),
    );
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const removeErrorRows = useCallback(() => {
    setRows((prev) => prev.filter((row) => row.errors.length === 0));
  }, []);

  const removeDuplicateRows = useCallback(() => {
    setRows((prev) => prev.filter((row) => !row.isDuplicate));
  }, []);

  const setCategoryForAll = useCallback((category: Category) => {
    setRows((prev) => prev.map((row) => ({ ...row, category })));
  }, []);

  const handleFinalize = useCallback(
    (onSuccess: (imported: number) => void) => {
      const validRows = rows.filter((row) => row.errors.length === 0);
      if (validRows.length === 0) return;
      setStep("importing");
      mutateImportExpenses(validRows, {
        onSuccess: (data) => {
          setImportStatus((prev) => ({
            ...prev,
            successMessage: `Successfully imported ${data.imported} expenses`,
          }));
          onSuccess(data.imported);
        },
      });
    },
    [rows, mutateImportExpenses],
  );

  const totalRows = rows.length;
  const validRows = rows.filter((row) => row.errors.length === 0).length;
  const errorRows = rows.filter((row) => row.errors.length > 0).length;
  const duplicateRows = rows.filter((row) => row.isDuplicate).length;

  return {
    step,
    rows,
    warnings,
    importStatus,
    importError,
    isImporting,
    totalRows,
    validRows,
    errorRows,
    duplicateRows,
    processFile,
    updateRow,
    updateCategory,
    removeRow,
    removeErrorRows,
    removeDuplicateRows,
    setCategoryForAll,
    handleFinalize,
    resetState,
  };
}
