"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Profile } from "../domain/profile";
import { useDeleteProfile } from "../core/store";

interface DeleteProfileDialogProps {
  profile: Profile | null;
  onClose: () => void;
}

export function DeleteProfileDialog({
  profile,
  onClose,
}: DeleteProfileDialogProps) {
  const { mutate, isPending, error, reset } = useDeleteProfile();

  useEffect(() => {
    reset();
  }, [profile, reset]);

  const handleConfirm = () => {
    if (!profile) return;
    mutate(profile.id, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <Dialog open={!!profile} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>
            Delete <strong>{profile?.name}</strong>? All expenses in this
            profile will be permanently deleted.
          </p>
          {error && <p className="text-sm text-destructive">{error.message}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
