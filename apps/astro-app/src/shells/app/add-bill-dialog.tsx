"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BillEntryFormBody } from "@/modules/bill-management/presentation/bill-entry-form";
import { BillImportBody } from "@/modules/bill-import/presentation/bill-import";
import { cn } from "@/lib/utils";

interface AddBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddBillDialog({ open, onOpenChange }: AddBillDialogProps) {
  const [tab, setTab] = useState("single");

  useEffect(() => {
    if (!open) setTab("single");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[90vh] flex-col",
          tab === "import" ? "max-w-4xl" : "max-w-lg",
        )}
      >
        <DialogHeader>
          <DialogTitle>Add Bills</DialogTitle>
        </DialogHeader>
        <Tabs
          value={tab}
          onValueChange={setTab}
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <TabsList className="w-full">
            <TabsTrigger value="single" className="flex-1">
              Single Bill
            </TabsTrigger>
            <TabsTrigger value="import" className="flex-1">
              Import File
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="single"
            className="-mx-2 mt-0 min-h-0 flex-1 overflow-y-auto px-2"
          >
            <BillEntryFormBody
              active={open && tab === "single"}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>
          <TabsContent
            value="import"
            className="mt-0 flex min-h-0 flex-1 flex-col"
          >
            <BillImportBody
              active={open && tab === "import"}
              onDone={() => onOpenChange(false)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
