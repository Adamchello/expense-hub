"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Callout, errorMessage } from "./callout";

/**
 * Taken from the primitive itself: the repo resolves two copies of
 * @types/react, so a bare `ReactNode` import is not assignable here.
 */
type DialogChildren = React.ComponentProps<
  typeof DialogDescription
>["children"];

/**
 * "Are you sure?" — asked the same way everywhere.
 *
 * Uses the real `DialogFooter`, which stacks its buttons in reverse on narrow
 * screens. Four hand-rolled `flex justify-end` footers did not, so the
 * destructive action sat under the thumb on a phone.
 */
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: DialogChildren;
  confirmLabel: string;
  pendingLabel: string;
  onConfirm: () => void;
  isPending?: boolean;
  error?: unknown;
  errorFallback?: string;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel,
  onConfirm,
  isPending = false,
  error,
  errorFallback = "Something went wrong",
  destructive = true,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-foreground/80">
            {description}
          </DialogDescription>
        </DialogHeader>

        {error != null && (
          <Callout variant="error">
            {errorMessage(error, errorFallback)}
          </Callout>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={onConfirm}
            loading={isPending}
          >
            {isPending ? pendingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
