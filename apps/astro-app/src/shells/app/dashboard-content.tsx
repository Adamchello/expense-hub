"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BillHistory } from "@/modules/bill-management/presentation/bill-history";
import { DashboardOverview } from "@/modules/bill-management/presentation/dashboard-overview";
import { RecurringBills } from "@/modules/recurring-bills/presentation/recurring-bills";
import { UpcomingReminders } from "@/modules/recurring-bills/presentation/upcoming-reminders";
import { useBills } from "@/modules/bill-management/core/store";
import { ProfileSwitcher } from "@/modules/multi-profile-account/presentation/profile-switcher";
import { ProfilesSection } from "@/modules/multi-profile-account/presentation/profiles-section";
import { AddBillDialog } from "./add-bill-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/kernel/auth/use-auth";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Receipt,
  Repeat,
  Settings,
  Wallet2,
  X,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const NAV_GROUPS = [
  {
    label: "Overview",
    tabs: [
      { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { value: "history", label: "History", icon: Receipt },
      { value: "recurring", label: "Recurring", icon: Repeat },
    ],
  },
  {
    label: "Account",
    tabs: [{ value: "settings", label: "Settings", icon: Settings }],
  },
] as const;

const TAB_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  history: "Bill History",
  recurring: "Recurring Bills",
  settings: "Settings",
};

export function DashboardContent() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const auth = useAuth();
  const email = auth.status === "authenticated" ? auth.user?.email : "";

  const query = useBills();

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setIsNavOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Wallet2 className="size-4.5" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-sidebar-foreground">
          Smart Bill Assistant
        </span>
      </div>

      {/* Profile switcher */}
      <div className="px-3">
        <ProfileSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <TabsList className="flex h-auto w-full flex-col items-stretch justify-start gap-1 rounded-none bg-transparent p-0">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-1 pb-4">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              {group.tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="justify-start gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-accent-foreground data-[state=active]:shadow-none"
                >
                  <tab.icon className="size-4.5 shrink-0" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </div>
          ))}
        </TabsList>
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/50 p-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {(email?.[0] ?? "?").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-sidebar-foreground">
              Welcome {email}
            </p>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <LogOut className="size-3" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      orientation="vertical"
      className="flex min-h-screen w-full flex-row gap-0 bg-background"
    >
      {/* Desktop sidebar */}
      <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile nav drawer */}
      {isNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setIsNavOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar shadow-2xl">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setIsNavOpen(false)}
              className="absolute right-3 top-5 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <Button
            variant="outline"
            size="icon"
            aria-label="Open menu"
            className="lg:hidden"
            onClick={() => setIsNavOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            {TAB_TITLES[activeTab]}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button
              className="hidden sm:inline-flex"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus className="size-4" />
              Add Bill
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            {query.error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">
                  {query.error instanceof Error
                    ? query.error.message
                    : "Failed to load bills"}
                </p>
              </div>
            )}

            <TabsContent value="dashboard" className="mt-0">
              <div className="flex flex-col gap-6">
                <UpcomingReminders />
                <DashboardOverview bills={query.data || []} />
              </div>
            </TabsContent>
            <TabsContent value="history" className="mt-0">
              {query.isLoading ? (
                <div className="rounded-xl bg-card p-8 text-center ring-1 ring-foreground/10">
                  <p className="text-muted-foreground">Loading bills...</p>
                </div>
              ) : (
                <BillHistory
                  bills={query.data || []}
                  onRefresh={() => query.refetch()}
                />
              )}
            </TabsContent>
            <TabsContent value="recurring" className="mt-0">
              <RecurringBills />
            </TabsContent>
            <TabsContent value="settings" className="mt-0">
              <div className="max-w-2xl">
                <ProfilesSection />
              </div>
            </TabsContent>
          </div>
        </main>
      </div>

      {/* Mobile floating add button */}
      <Button
        aria-label="Add bill"
        onClick={() => setIsAddOpen(true)}
        className="fixed bottom-5 right-5 z-40 size-14 rounded-full shadow-lg sm:hidden"
      >
        <Plus className="size-6" />
      </Button>

      <AddBillDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </Tabs>
  );
}
