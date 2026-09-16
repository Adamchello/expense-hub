"use client";

import { useNavigate } from "@tanstack/react-router";
import { Store, Tags, UsersRound } from "lucide-react";
import { SegmentedControl } from "@/libs/ui/segmented-control";
import { CategoriesSection } from "@/modules/category-management/presentation/categories-section";
import { MerchantsSection } from "@/modules/merchant-management/presentation/merchants-section";
import { ProfilesSection } from "@/modules/multi-profile-account/presentation/profiles-section";
import {
  settingsSectionPath,
  type SettingsSection,
} from "@/shared/routing/app-router";
import { PageTitle } from "./page-title";

/**
 * Settings is three unrelated jobs, and stacking them made one long page
 * where the thing you came for was always below the thing you did not. One
 * section at a time now, with the same title-then-switch stack History uses —
 * the switch belongs to the page, so it sits under the title, above the
 * content.
 */
const SECTION_OPTIONS = [
  { value: "profiles", label: "Profiles", icon: UsersRound },
  { value: "categories", label: "Categories", icon: Tags },
  { value: "merchants", label: "Merchants", icon: Store },
] as const;

const SECTIONS: Record<SettingsSection, () => React.JSX.Element> = {
  profiles: ProfilesSection,
  categories: CategoriesSection,
  merchants: MerchantsSection,
};

export function SettingsPage({ section }: { section: SettingsSection }) {
  const navigate = useNavigate();
  const Section = SECTIONS[section];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-start gap-3">
        <PageTitle>Settings</PageTitle>
        <SegmentedControl
          value={section}
          onChange={(next) =>
            navigate({ to: settingsSectionPath(next), replace: true })
          }
          options={SECTION_OPTIONS}
          label="Settings section"
        />
      </div>

      {/* Keyed on the section so a switch remounts the panel and the fade
          reads as "new content", not as the old one flickering. */}
      <div
        key={section}
        className="max-w-2xl animate-in fade-in duration-200 ease-out-quart motion-reduce:animate-none"
      >
        <Section />
      </div>
    </div>
  );
}
