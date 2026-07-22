"use client";

import { useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Callout, errorMessage } from "@/components/shared";
import { FileDropZone } from "./import/file-drop-zone";
import { ImportStats } from "./import/import-stats";
import { ImportTable } from "./import/import-table";
import { ImportErrors } from "./import/import-errors";
import { BulkActions } from "./import/bulk-actions";
import { useExpenses } from "@/modules/expense-management/core/store";
import { useImportStore } from "../core/store";

interface ExpenseImportBodyProps {
  /** When false the import wizard resets (mirrors the old close-resets behavior). */
  active: boolean;
  onDone: () => void;
}

export function ExpenseImportBody({ active, onDone }: ExpenseImportBodyProps) {
  const { data: existingExpenses } = useExpenses({ enabled: active });
  const store = useImportStore(existingExpenses);

  useEffect(() => {
    if (!active) store.resetState();
  }, [active, store.resetState]);

  const handleFinalize = useCallback(() => {
    store.handleFinalize(() => {
      setTimeout(() => {
        store.resetState();
        onDone();
      }, 2000);
    });
  }, [store, onDone]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <h3
        data-e2e="expense-import.title"
        className="text-base font-medium leading-snug"
      >
        {store.step === "upload" && "Import Expenses"}
        {store.step === "review" && "Review Import"}
        {store.step === "importing" && "Importing..."}
      </h3>

      <div className="min-h-0 flex-1 overflow-hidden">
        {store.step === "upload" && (
          <FileDropZone
            onFileSelect={store.processFile}
            isProcessing={store.importStatus.isProcessing}
            errors={store.importStatus.errors}
          />
        )}

        {(store.step === "review" || store.step === "importing") && (
          <div className="space-y-4 h-full flex flex-col">
            <ImportStats
              total={store.totalRows}
              valid={store.validRows}
              errors={store.errorRows}
              duplicates={store.duplicateRows}
            />
            <BulkActions
              errorCount={store.errorRows}
              duplicateCount={store.duplicateRows}
              onRemoveErrorRows={store.removeErrorRows}
              onRemoveDuplicateRows={store.removeDuplicateRows}
              onSetCategoryForAll={store.setCategoryForAll}
            />
            <div className="flex-1 min-h-0 ">
              <ImportTable
                rows={store.rows}
                onUpdateRow={store.updateRow}
                onUpdateCategory={store.updateCategory}
                onRemoveRow={store.removeRow}
              />
            </div>
            <ImportErrors rows={store.rows} />
            {store.importError && (
              <Callout
                variant="error"
                data-e2e="expense-import.state.error"
                className="shrink-0"
              >
                {errorMessage(store.importError, "Failed to import expenses")}
              </Callout>
            )}
            {store.importStatus.successMessage && (
              <Callout
                variant="success"
                data-e2e="expense-import.state.success"
                className="shrink-0"
              >
                {store.importStatus.successMessage}
              </Callout>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          data-e2e="expense-import.button.cancel"
          variant="outline"
          onClick={onDone}
          disabled={store.isImporting}
        >
          Cancel
        </Button>
        {store.step === "review" && (
          <Button
            data-e2e="expense-import.button.finalize"
            onClick={handleFinalize}
            disabled={store.validRows === 0 || store.isImporting}
          >
            {store.isImporting
              ? "Importing..."
              : `Import ${store.validRows} Expenses`}
          </Button>
        )}
      </div>
    </div>
  );
}

interface ExpenseImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseImport({ open, onOpenChange }: ExpenseImportProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Import expenses</DialogTitle>
        </DialogHeader>
        <ExpenseImportBody active={open} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
