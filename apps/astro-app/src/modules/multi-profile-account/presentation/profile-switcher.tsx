"use client";

import { Link } from "@tanstack/react-router";
import { Settings, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  useActiveProfile,
  useProfiles,
  useSwitchActiveProfile,
} from "../core/store";

export function ProfileSwitcher() {
  const profilesQuery = useProfiles();
  const { activeProfileId, isLoading } = useActiveProfile();
  const switchMutation = useSwitchActiveProfile();

  const profiles = profilesQuery.data ?? [];

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
    <div className="flex items-center gap-2" data-testid="profile-switcher">
      <Select
        value={activeProfileId ?? undefined}
        onValueChange={handleChange}
        disabled={switchMutation.isPending}
      >
        <SelectTrigger className="w-[180px]" aria-label="Active profile">
          <SelectValue placeholder="Select profile" />
        </SelectTrigger>
        <SelectContent>
          {profiles.map((profile) => (
            <SelectItem key={profile.id} value={profile.id}>
              {profile.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="ghost" size="icon" asChild aria-label="Manage profiles">
        <Link to="/settings">
          <Settings className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
