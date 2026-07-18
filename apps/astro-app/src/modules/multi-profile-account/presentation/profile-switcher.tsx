"use client";

import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  useActiveProfile,
  useProfiles,
  useSwitchActiveProfile,
} from "../core/store";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

export function ProfileSwitcher() {
  const profilesQuery = useProfiles();
  const { activeProfileId, isLoading } = useActiveProfile();
  const switchMutation = useSwitchActiveProfile();

  const profiles = profilesQuery.data ?? [];
  const activeProfile = profiles.find(
    (profile) => profile.id === activeProfileId,
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading profile...
      </div>
    );
  }

  const handleChange = (value: string) => {
    if (value === activeProfileId) return;
    switchMutation.mutate(value);
  };

  return (
    <div data-testid="profile-switcher">
      <Select
        value={activeProfileId ?? undefined}
        onValueChange={handleChange}
        disabled={switchMutation.isPending}
      >
        <SelectTrigger
          aria-label="Active profile"
          className="h-auto w-full items-center gap-2.5 rounded-xl border-sidebar-border bg-card/60 p-2 text-left shadow-none transition-colors hover:bg-sidebar-accent/60"
        >
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-sidebar-foreground ml-1">
            {activeProfile?.name ?? "Select profile"}
          </span>
        </SelectTrigger>
        <SelectContent>
          {profiles.map((profile) => (
            <SelectItem key={profile.id} value={profile.id}>
              {profile.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
