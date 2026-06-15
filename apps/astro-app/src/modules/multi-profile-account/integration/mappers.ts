import type { Profile } from "../domain/profile";
import type { AccountSettings } from "../domain/account-settings";

interface ApiProfile {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface ApiAccountSettings {
  account_id: string;
  active_profile_id: string | null;
  updated_at: string;
}

export function mapProfile(raw: ApiProfile): Profile {
  return {
    id: raw.id,
    name: raw.name,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

export function mapProfiles(raw: ApiProfile[]): Profile[] {
  return raw.map(mapProfile);
}

export function mapAccountSettings(raw: ApiAccountSettings): AccountSettings {
  return {
    account_id: raw.account_id,
    active_profile_id: raw.active_profile_id,
    updated_at: raw.updated_at,
  };
}
