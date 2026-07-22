"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Profile } from "../domain/profile";
import { useRenameProfile } from "../core/store";

interface RenameProfileDialogProps {
  profile: Profile | null;
  onClose: () => void;
}

export function RenameProfileDialog({
  profile,
  onClose,
}: RenameProfileDialogProps) {
  const [name, setName] = useState(profile?.name ?? "");
  const { mutate, isPending, error, reset } = useRenameProfile();

  useEffect(() => {
    setName(profile?.name ?? "");
    reset();
  }, [profile, reset]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === profile.name) {
      onClose();
      return;
    }
    mutate(
      { id: profile.id, name: trimmed },
      {
        onSuccess: () => onClose(),
      },
    );
  };

  return (
    <Dialog open={!!profile} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldContent>
              <FieldLabel htmlFor="rename-profile-name">New name</FieldLabel>
              <Input
                id="rename-profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                autoFocus
              />
              {error && <FieldError>{error.message}</FieldError>}
            </FieldContent>
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending} disabled={!name.trim()}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
