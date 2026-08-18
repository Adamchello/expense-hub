import type { z } from "zod";
import type { profileRowSchema } from "@/shared/server-contracts/schemas/profile";
import type { accountSettingsRowSchema } from "@/shared/server-contracts/schemas/account-settings";
import type { Profile } from "../domain/profile";
import type { AccountSettings } from "../domain/account-settings";

export type ProfileDto = z.infer<typeof profileRowSchema>;
export type AccountSettingsDto = z.infer<typeof accountSettingsRowSchema>;

export function mapProfile(raw: ProfileDto): Profile {
  return {
    id: raw.id,
    name: raw.name,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

export function mapProfiles(raw: ProfileDto[]): Profile[] {
  return raw.map(mapProfile);
}

export function mapAccountSettings(raw: AccountSettingsDto): AccountSettings {
  return {
    account_id: raw.account_id,
    active_profile_id: raw.active_profile_id,
    updated_at: raw.updated_at,
  };
}
