export const PROFILE_EVENTS = {
  CREATED: "profile.created",
  RENAMED: "profile.renamed",
  DELETED: "profile.deleted",
  ACTIVE_CHANGED: "profile.active_changed",
} as const;

export type ProfileEvent = (typeof PROFILE_EVENTS)[keyof typeof PROFILE_EVENTS];
