import type { Profile } from "../domain/profile";
import type { AccountSettings } from "../domain/account-settings";
import { mapAccountSettings, mapProfile, mapProfiles } from "./mappers";

async function parseError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body?.error || body?.message || "Request failed";
  } catch {
    return "Request failed";
  }
}

export const listProfiles = async (
  signal?: AbortSignal,
): Promise<Profile[]> => {
  const response = await fetch("/api/profiles", { signal });
  if (!response.ok) throw new Error(await parseError(response));
  const body = await response.json();
  return mapProfiles(body.data ?? []);
};

export const createProfile = async (
  input: { name: string },
  signal?: AbortSignal,
): Promise<Profile> => {
  const response = await fetch("/api/profiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok) throw new Error(await parseError(response));
  const body = await response.json();
  return mapProfile(body.data);
};

export const updateProfile = async (
  id: string,
  input: { name: string },
  signal?: AbortSignal,
): Promise<Profile> => {
  const response = await fetch(`/api/profiles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok) throw new Error(await parseError(response));
  const body = await response.json();
  return mapProfile(body.data);
};

export const deleteProfile = async (
  id: string,
  signal?: AbortSignal,
): Promise<void> => {
  const response = await fetch(`/api/profiles/${id}`, {
    method: "DELETE",
    signal,
  });
  if (!response.ok && response.status !== 204) {
    throw new Error(await parseError(response));
  }
};

export const getAccountSettings = async (
  signal?: AbortSignal,
): Promise<AccountSettings> => {
  const response = await fetch("/api/account-settings", { signal });
  if (!response.ok) throw new Error(await parseError(response));
  const body = await response.json();
  return mapAccountSettings(body.data);
};

export const updateAccountSettings = async (
  input: { activeProfileId: string },
  signal?: AbortSignal,
): Promise<AccountSettings> => {
  const response = await fetch("/api/account-settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok) throw new Error(await parseError(response));
  const body = await response.json();
  return mapAccountSettings(body.data);
};
