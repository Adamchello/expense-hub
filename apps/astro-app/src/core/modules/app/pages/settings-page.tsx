"use client";

import { CategoriesSection } from "@/modules/category-management/presentation/categories-section";
import { MerchantsSection } from "@/modules/merchant-management/presentation/merchants-section";
import { ProfilesSection } from "@/modules/multi-profile-account/presentation/profiles-section";
import { PageTitle } from "./page-title";

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageTitle>Settings</PageTitle>
      <div className="flex max-w-2xl flex-col gap-6">
        <ProfilesSection />
        <CategoriesSection />
        <MerchantsSection />
      </div>
    </div>
  );
}
