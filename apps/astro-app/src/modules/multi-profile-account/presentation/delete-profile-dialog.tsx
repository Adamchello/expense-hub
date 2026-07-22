"use client";

import { useEffect } from "react";
import { ConfirmDialog } from "@/components/shared";
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
    <ConfirmDialog
      open={!!profile}
      onOpenChange={(o) => !o && onClose()}
      title="Delete profile?"
      description={
        <>
          Delete <strong>{profile?.name}</strong>? All expenses in this profile
          will be permanently deleted.
        </>
      }
      confirmLabel="Delete"
      pendingLabel="Deleting..."
      onConfirm={handleConfirm}
      isPending={isPending}
      error={error}
      errorFallback="Failed to delete profile"
    />
  );
}
