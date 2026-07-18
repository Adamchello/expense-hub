"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Bill } from "../domain/bill";
import { useUpdateBill } from "../core/store";
import { BillFormBody, type BillSubmitData } from "./bill-entry-form";

interface EditBillDialogProps {
  bill: Bill | null;
  onOpenChange: (open: boolean) => void;
}

export function EditBillDialog({ bill, onOpenChange }: EditBillDialogProps) {
  const { mutate, error, isPending, reset } = useUpdateBill();

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleSubmit = (data: BillSubmitData) => {
    if (!bill) return;
    mutate(
      { id: bill.id, formData: data },
      {
        onSuccess: () => handleClose(),
      },
    );
  };

  return (
    <Dialog
      open={!!bill}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Bill</DialogTitle>
        </DialogHeader>
        <BillFormBody
          key={bill?.id ?? "closed"}
          active={!!bill}
          onCancel={handleClose}
          onSubmit={handleSubmit}
          initialBill={bill}
          error={error}
          isPending={isPending}
          submitLabel="Save Changes"
          pendingLabel="Saving..."
          errorFallback="Failed to update bill"
        />
      </DialogContent>
    </Dialog>
  );
}
