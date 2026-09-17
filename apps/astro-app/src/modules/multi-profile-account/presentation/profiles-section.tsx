"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/libs/ui/button";
import { Card, CardContent } from "@/libs/ui/card";
import { SkeletonList } from "@/libs/ui/skeleton";
import { Callout, errorMessage } from "@/libs/ui/callout";
import { DataList } from "@/libs/ui/data-list";
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

const PROFILE_LIMIT = 10;

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
    <section
      aria-labelledby="settings-profiles"
      className="flex flex-col gap-4"
    >
      <h2 id="settings-profiles" className="sr-only">
        Profiles
      </h2>
      <p className="max-w-prose text-sm text-muted-foreground">
        Keep business, family and personal spending apart. Every list and total
        shows one profile at a time; switch between them from the sidebar.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {profiles.length} of {PROFILE_LIMIT} profiles
        </p>
        <Button
          onClick={() => setCreateOpen(true)}
          disabled={!canCreate}
          aria-label="Create profile"
        >
          <Plus className="size-4" />
          New profile
        </Button>
      </div>

      {!canCreate && (
        <Callout variant="info" showIcon={false}>
          Profile limit reached. Delete a profile to make room for a new one.
        </Callout>
      )}

      {profilesQuery.error && (
        <Callout variant="error">
          {errorMessage(profilesQuery.error, "Failed to load profiles")}
        </Callout>
      )}

      {profilesQuery.isLoading ? (
        <SkeletonList rows={3} />
      ) : (
        <Card>
          <CardContent>
            <DataList>
              {profiles.map((profile) => {
                const isActive = profile.id === activeProfileId;
                return (
                  <li
                    key={profile.id}
                    className="flex items-center gap-2 py-2.5 first:pt-0 last:pb-0"
                    data-testid={`profile-row-${profile.id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {profile.name}
                      </p>
                      {isActive && (
                        <p className="mt-0.5 text-xs font-medium text-primary">
                          Active
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setRenameTarget(profile)}
                      aria-label={`Rename ${profile.name}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setDeleteTarget(profile)}
                      disabled={!canDelete}
                      aria-label={`Delete ${profile.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                );
              })}
            </DataList>
          </CardContent>
        </Card>
      )}

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
