"use client";

import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfilesSection } from "@/modules/multi-profile-account/presentation/profiles-section";

export function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link to="/app" aria-label="Back to dashboard">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to dashboard
        </Link>
      </Button>

      <header className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
      </header>

      <Tabs defaultValue="profiles">
        <TabsList>
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
        </TabsList>
        <TabsContent value="profiles" className="pt-4">
          <ProfilesSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
