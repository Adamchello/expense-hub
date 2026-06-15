"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BillEntryForm } from "@/modules/bill-management/presentation/bill-entry-form";
import { BillHistory } from "@/modules/bill-management/presentation/bill-history";
import { BillForecasts } from "@/modules/bill-forecasts/presentation/bill-forecasts";
import { BillInsights } from "@/modules/bill-insights/presentation/bill-insights";
import { DashboardOverview } from "@/modules/bill-management/presentation/dashboard-overview";
import { useBills } from "@/modules/bill-management/core/store";
import { BillImport } from "@/modules/bill-import/presentation/bill-import";
import { ProfileSwitcher } from "@/modules/multi-profile-account/presentation/profile-switcher";
import { useAuth } from "@/kernel/auth/use-auth";
import { Upload } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function DashboardContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const auth = useAuth();
  const email = auth.status === "authenticated" ? auth.user?.email : "";

  const query = useBills();

  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome {email}</h1>
          <p className="text-muted-foreground mt-2">
            We are happy to see you here
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ProfileSwitcher />
          <form action="/api/auth/signout">
            <button
              type="submit"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      <div className="mb-6 flex gap-3">
        <Button onClick={() => setIsModalOpen(true)}>Add Bill</Button>
        <Button variant="outline" onClick={() => setIsImportOpen(true)}>
          <Upload className="h-4 w-4" />
          Import Bills
        </Button>
      </div>

      <BillEntryForm open={isModalOpen} onOpenChange={handleModalClose} />
      <BillImport open={isImportOpen} onOpenChange={setIsImportOpen} />

      {query.error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 mb-6">
          <p className="text-sm text-destructive">
            {query.error instanceof Error
              ? query.error.message
              : "Failed to load bills"}
          </p>
        </div>
      )}

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <DashboardOverview bills={query.data || []} />
        </TabsContent>
        <TabsContent value="history">
          {query.isLoading ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">Loading bills...</p>
            </div>
          ) : (
            <BillHistory
              bills={query.data || []}
              onRefresh={() => query.refetch()}
            />
          )}
        </TabsContent>
        <TabsContent value="forecasts">
          <BillForecasts />
        </TabsContent>
        <TabsContent value="insights">
          <BillInsights />
        </TabsContent>
      </Tabs>
    </div>
  );
}
