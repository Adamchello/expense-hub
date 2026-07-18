import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import type { AccountSettings } from "../domain/account-settings";
import {
  createProfile,
  deleteProfile,
  getAccountSettings,
  listProfiles,
  updateAccountSettings,
  updateProfile,
} from "../integration/repository";

const PROFILES_KEY = ["profiles"] as const;
const ACCOUNT_SETTINGS_KEY = ["account-settings"] as const;

export const PROFILE_QUERY_KEYS = {
  profiles: PROFILES_KEY,
  accountSettings: ACCOUNT_SETTINGS_KEY,
};

export function useProfiles(options?: { enabled?: boolean }) {
  return useQuery(
    {
      queryKey: PROFILES_KEY,
      queryFn: ({ signal }) => listProfiles(signal),
      enabled: options?.enabled,
    },
    queryClient,
  );
}

export function useAccountSettings(options?: { enabled?: boolean }) {
  return useQuery(
    {
      queryKey: ACCOUNT_SETTINGS_KEY,
      queryFn: ({ signal }) => getAccountSettings(signal),
      enabled: options?.enabled,
    },
    queryClient,
  );
}

export function useActiveProfile() {
  const profilesQuery = useProfiles();
  const settingsQuery = useAccountSettings();

  const activeId = settingsQuery.data?.active_profile_id ?? null;
  const profile =
    activeId && profilesQuery.data
      ? (profilesQuery.data.find((p) => p.id === activeId) ?? null)
      : null;

  return {
    activeProfileId: activeId,
    activeProfile: profile,
    isLoading: profilesQuery.isLoading || settingsQuery.isLoading,
  };
}

export function useCanCreateProfile() {
  const { data } = useProfiles();
  return (data?.length ?? 0) < 10;
}

export function useCanDeleteProfile() {
  const { data } = useProfiles();
  return (data?.length ?? 0) > 1;
}

export function useCreateProfile() {
  return useMutation(
    {
      mutationFn: (input: { name: string }) => createProfile(input),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: PROFILES_KEY });
      },
    },
    queryClient,
  );
}

export function useRenameProfile() {
  return useMutation(
    {
      mutationFn: (input: { id: string; name: string }) =>
        updateProfile(input.id, { name: input.name }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: PROFILES_KEY });
      },
    },
    queryClient,
  );
}

function invalidateProfileScopedQueries() {
  queryClient.invalidateQueries({ queryKey: ["bills"] });
  queryClient.invalidateQueries({ queryKey: ["recurring-bills"] });
}

export function useDeleteProfile() {
  return useMutation(
    {
      mutationFn: (id: string) => deleteProfile(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: PROFILES_KEY });
        queryClient.invalidateQueries({ queryKey: ACCOUNT_SETTINGS_KEY });
        invalidateProfileScopedQueries();
      },
    },
    queryClient,
  );
}

export function useSwitchActiveProfile() {
  return useMutation(
    {
      mutationFn: (activeProfileId: string) =>
        updateAccountSettings({ activeProfileId }),
      onMutate: async (activeProfileId) => {
        await queryClient.cancelQueries({ queryKey: ACCOUNT_SETTINGS_KEY });
        const previous =
          queryClient.getQueryData<AccountSettings>(ACCOUNT_SETTINGS_KEY);
        if (previous) {
          queryClient.setQueryData<AccountSettings>(ACCOUNT_SETTINGS_KEY, {
            ...previous,
            active_profile_id: activeProfileId,
          });
        }
        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) {
          queryClient.setQueryData(ACCOUNT_SETTINGS_KEY, context.previous);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ACCOUNT_SETTINGS_KEY });
        invalidateProfileScopedQueries();
      },
    },
    queryClient,
  );
}
