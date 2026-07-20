"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useActiveProfile,
  useCanCreateProfile,
  useCanDeleteProfile,
  useProfiles,
} from "../core/store";
import type { Profile } from "../domain/profile";
import { CreateProfileDialog } from "./create-profile-dialog";
import { RenameProfileDialog } from "./rename-profile-dialog";
import { DeleteProfileDialog } from "./delete-profile-dialog";

export function ProfilesSection() {
  const profilesQuery = useProfiles();
  const { activeProfileId } = useActiveProfile();
  const canCreate = useCanCreateProfile();
  const canDelete = useCanDeleteProfile();

  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Profile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);

  const profiles = profilesQuery.data ?? [];

  return (
    <section>
      <header className="mb-6">
        <h2 className="text-xl font-semibold">Profiles</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Split expenses across separate profiles (e.g. business, family,
          personal).
        </p>
      </header>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {profiles.length} of 10 profiles
        </p>
        <Button
          onClick={() => setCreateOpen(true)}
          disabled={!canCreate}
          aria-label="Create profile"
        >
          <Plus className="h-4 w-4 mr-1" />
          New profile
        </Button>
      </div>

      {!canCreate && (
        <div className="rounded-md bg-muted p-3 mb-4 text-sm text-muted-foreground">
          Profile limit reached. Delete an existing profile to create a new one.
        </div>
      )}

      {profilesQuery.isLoading && (
        <p className="text-sm text-muted-foreground">Loading profiles...</p>
      )}

      {profilesQuery.error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 mb-4">
          <p className="text-sm text-destructive">
            {profilesQuery.error instanceof Error
              ? profilesQuery.error.message
              : "Failed to load profiles"}
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {profiles.map((profile) => {
          const isActive = profile.id === activeProfileId;
          return (
            <li
              key={profile.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
              data-testid={`profile-row-${profile.id}`}
            >
              <div>
                <p className="font-medium">{profile.name}</p>
                {isActive && (
                  <p className="text-xs text-muted-foreground">Active</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRenameTarget(profile)}
                  aria-label={`Rename ${profile.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(profile)}
                  disabled={!canDelete}
                  aria-label={`Delete ${profile.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <CreateProfileDialog open={createOpen} onOpenChange={setCreateOpen} />
      <RenameProfileDialog
        profile={renameTarget}
        onClose={() => setRenameTarget(null)}
      />
      <DeleteProfileDialog
        profile={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </section>
  );
}
