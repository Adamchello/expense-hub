"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ExpenseEntryFormBody } from "@/modules/expense-management/presentation/expense-entry-form";
import { ExpenseImportBody } from "@/modules/expense-import/presentation/expense-import";
import { cn } from "@/lib/utils";

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tab the dialog opens on; resets when closed. */
  initialTab?: "single" | "import";
}

export function AddExpenseDialog({
  open,
  onOpenChange,
  initialTab = "single",
}: AddExpenseDialogProps) {
  const [tab, setTab] = useState<string>(initialTab);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[90vh] flex-col",
          tab === "import" ? "max-w-4xl" : "max-w-lg",
        )}
      >
        <DialogHeader>
          <DialogTitle>Add Expenses</DialogTitle>
          <DialogDescription>
            Record a single expense, or import many at once from a CSV or Excel
            file.
          </DialogDescription>
        </DialogHeader>
        <Tabs
          value={tab}
          onValueChange={setTab}
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <TabsList className="w-full">
            <TabsTrigger value="single" className="flex-1">
              Single Expense
            </TabsTrigger>
            <TabsTrigger value="import" className="flex-1">
              Import File
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="single"
            className="-mx-2 mt-0 min-h-0 flex-1 overflow-y-auto px-2"
          >
            <ExpenseEntryFormBody
              active={open && tab === "single"}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>
          <TabsContent
            value="import"
            className="mt-0 flex min-h-0 flex-1 flex-col"
          >
            <ExpenseImportBody
              active={open && tab === "import"}
              onDone={() => onOpenChange(false)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
