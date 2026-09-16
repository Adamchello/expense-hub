import {
  SETTINGS_SECTIONS,
  isSettingsSection,
  settingsSectionPath,
} from "../app-router";

describe("settings sections", () => {
  it("gives every section its own path under /app/settings", () => {
    expect(SETTINGS_SECTIONS.map(settingsSectionPath)).toEqual([
      "/app/settings/profiles",
      "/app/settings/categories",
      "/app/settings/merchants",
    ]);
  });

  it("recognises only the three sections", () => {
    expect(isSettingsSection("merchants")).toBe(true);
    expect(isSettingsSection("recurring")).toBe(false);
    expect(isSettingsSection(undefined)).toBe(false);
  });
});
