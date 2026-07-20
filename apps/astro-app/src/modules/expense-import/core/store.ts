import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import type { ParsedExpenseRow } from "../domain/expense-import";
import type { Category } from "../domain/expense-import";
import type { Expense } from "@/modules/expense-management/domain/expense";
import { importExpenses } from "../integration/repository";
import { parseSpreadsheetFile } from "../integration/file-parsers";
import {
  validateSpreadsheetType,
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
  successMessage: string | null;
}

const INITIAL_STATUS: ImportStatus = {
  errors: [],
  isProcessing: false,
  successMessage: null,
};

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
  const [importStatus, setImportStatus] =
    useState<ImportStatus>(INITIAL_STATUS);

  const {
    mutate: mutateImportExpenses,
    error: importError,
    isPending: isImporting,
    reset: resetMutation,
  } = useImportExpenses();

  const resetState = useCallback(() => {
    setStep("upload");
    setRows([]);
    setImportStatus(INITIAL_STATUS);
    resetMutation();
  }, [resetMutation]);

  const processFile = useCallback(
    async (file: File) => {
      setImportStatus({ errors: [], isProcessing: true, successMessage: null });

      const typeValidation = validateSpreadsheetType(file);
      if (!typeValidation.valid) {
        setImportStatus({
          errors: [typeValidation.error!],
          isProcessing: false,
          successMessage: null,
        });
        return;
      }

      const sizeValidation = validateFileSize(file);
      if (!sizeValidation.valid) {
        setImportStatus({
          errors: [sizeValidation.error!],
          isProcessing: false,
          successMessage: null,
        });
        return;
      }

      const result = await parseSpreadsheetFile(file);

      if (!result.success || result.rows.length === 0) {
        setImportStatus({
          errors:
            result.errors.length > 0
              ? result.errors
              : ["No valid expense data found."],
          isProcessing: false,
          successMessage: null,
        });
        return;
      }

      let processedRows = categorizeRows(result.rows);
      if (existingExpenses) {
        processedRows = checkDuplicates(processedRows, existingExpenses);
      }

      setRows(processedRows);
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
