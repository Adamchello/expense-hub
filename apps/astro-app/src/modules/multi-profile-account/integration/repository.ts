import { apiRequest } from "@/libs/api/api-client";
import type {
  ListProfilesResult,
  CreateProfileInput,
  CreateProfileResult,
  RenameProfileInput,
  RenameProfileResult,
  DeleteProfileResult,
} from "@/shared/server-contracts/schemas/profile";
import type {
  AccountSettingsResult,
  UpdateAccountSettingsInput,
  UpdateAccountSettingsResult,
} from "@/shared/server-contracts/schemas/account-settings";
import type { Profile } from "../domain/profile";
import type { AccountSettings } from "../domain/account-settings";
import { mapAccountSettings, mapProfile, mapProfiles } from "./mappers";

export const listProfiles = async (
  signal?: AbortSignal,
): Promise<Profile[]> => {
  const response = await apiRequest<ListProfilesResult>("/api/profiles", {
    signal,
  });
  return mapProfiles(response.data);
};

export const createProfile = async (
  input: CreateProfileInput,
  signal?: AbortSignal,
): Promise<Profile> => {
  const response = await apiRequest<CreateProfileResult>("/api/profiles", {
    method: "POST",
    body: input,
    signal,
  });
  return mapProfile(response.data);
};

export const updateProfile = async (
  id: string,
  input: Omit<RenameProfileInput, "id">,
  signal?: AbortSignal,
): Promise<Profile> => {
  const response = await apiRequest<RenameProfileResult>(
    `/api/profiles/${id}`,
    { method: "PATCH", body: input, signal },
  );
  return mapProfile(response.data);
};

export const deleteProfile = async (
  id: string,
  signal?: AbortSignal,
): Promise<void> => {
  await apiRequest<DeleteProfileResult>(`/api/profiles/${id}`, {
    method: "DELETE",
    signal,
  });
};

export const getAccountSettings = async (
  signal?: AbortSignal,
): Promise<AccountSettings> => {
  const response = await apiRequest<AccountSettingsResult>(
    "/api/account-settings",
    { signal },
  );
  return mapAccountSettings(response.data);
};

export const updateAccountSettings = async (
  input: UpdateAccountSettingsInput,
  signal?: AbortSignal,
): Promise<AccountSettings> => {
  const response = await apiRequest<UpdateAccountSettingsResult>(
    "/api/account-settings",
    { method: "PATCH", body: input, signal },
  );
  return mapAccountSettings(response.data);
};
