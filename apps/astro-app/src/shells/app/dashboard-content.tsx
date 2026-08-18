"use client";

import { useEffect, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Button } from "@/libs/ui/button";
import { SpendingAnalytics } from "@/modules/spending-analytics/presentation/spending-analytics";
import { CategoriesSection } from "@/modules/category-management/presentation/categories-section";
import { MerchantsSection } from "@/modules/merchant-management/presentation/merchants-section";
import { useExpenses } from "@/modules/expense-management/core/store";
import { ProfileSwitcher } from "@/modules/multi-profile-account/presentation/profile-switcher";
import { ProfilesSection } from "@/modules/multi-profile-account/presentation/profiles-section";
import { AddExpenseDialog } from "./add-expense-dialog";
import { DashboardView } from "./dashboard-view";
import { HistoryView, type HistoryViewMode } from "./history-view";
import { Toaster } from "@/libs/ui/toaster";
import { SkeletonAnalytics, SkeletonDashboard } from "@/libs/ui/skeleton";
import { Callout, SectionLabel, errorMessage } from "@/components/shared";
import { useAuth } from "@/shared/auth/use-auth";
import { cn } from "@/libs/ui/utils";
import {
  ChartColumn,
  LayoutDashboard,
  Leaf,
  LogOut,
  Plus,
  Receipt,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/libs/ui/tabs";

const NAV_GROUPS = [
  {
    label: "Overview",
    tabs: [
      { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { value: "history", label: "History", icon: Receipt },
      { value: "analytics", label: "Analytics", icon: ChartColumn },
    ],
  },
  {
    label: "Account",
    tabs: [{ value: "settings", label: "Settings", icon: Settings }],
  },
] as const;

/**
 * The phone's primary navigation. Four destinations, and now the sidebar has
 * exactly the same four — Recurring folded into History, which is where a
 * repeating charge and the charges it already produced belong together.
 */
const BOTTOM_NAV = [
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { value: "history", label: "History", icon: Receipt },
  { value: "analytics", label: "Analytics", icon: ChartColumn },
  { value: "settings", label: "Settings", icon: Settings },
] as const;

const TAB_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  history: "History",
  analytics: "Spending analytics",
  settings: "Settings",
};

/** "Good morning" / "Good afternoon" / "Good evening", by the reader's clock. */
const timeOfDayGreeting = (hour: number): string => {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

/**
 * A first name out of an email local part — "ada.lovelace@x.com" → "Ada".
 * Falls back to no name at all rather than greeting someone by a string of
 * digits or their full address.
 */
const displayNameFrom = (email: string | undefined): string => {
  const local = email?.split("@")[0] ?? "";
  const first = local.split(/[._-]/)[0].replace(/[^a-zA-Z]/g, "");
  if (first.length < 2) return "";
  return first[0].toUpperCase() + first.slice(1).toLowerCase();
};

/**
 * The avatar's letter. An account with no readable initial rendered "?" in a
 * green circle where a person's initial goes, which reads as an error state
 * rather than as an absence. The leaf mark is the app's own, and says nothing
 * false about who is signed in.
 */
const avatarInitial = (email: string | undefined): string | null => {
  const letter = email?.trim()[0];
  return letter && /[a-zA-Z]/.test(letter) ? letter.toUpperCase() : null;
};

export function DashboardContent() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addTab, setAddTab] = useState<"single" | "import">("single");
  const [addDate, setAddDate] = useState<string | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Active tab lives in the URL (?tab=) so views deep-link and survive reload.
  // History's sub-view rides along in ?view= for the same reason.
  const navigate = useNavigate();
  const { tab: activeTab, view: historyView } = useSearch({ from: "/app" });

  const openAddExpense = (
    tab: "single" | "import" = "single",
    date: string | null = null,
  ) => {
    setAddTab(tab);
    setAddDate(date);
    setIsAddOpen(true);
  };
  const auth = useAuth();
  const email = auth.status === "authenticated" ? auth.user?.email : "";
  const name = displayNameFrom(email);
  const greeting = `${timeOfDayGreeting(new Date().getHours())}${name ? `, ${name}` : ""}`;

  const query = useExpenses();

  // The tab is the page, so the tab is the document title. It used to read
  // "ExpenseHub" on all four, which leaves a screen-reader user, a tab strip
  // and a browser-history entry with no idea which view they are on.
  useEffect(() => {
    document.title = `${TAB_TITLES[activeTab] ?? "Dashboard"} · ExpenseHub`;
  }, [activeTab]);

  const handleTabChange = (value: string, view?: HistoryViewMode) => {
    // `replace` so Back leaves the app instead of walking every tab the user
    // has visited this session — tab switching is not navigation history.
    navigate({
      to: "/app",
      search: {
        tab: value as typeof activeTab,
        view: view ?? (value === "history" ? historyView : "list"),
      },
      replace: true,
    });
    setIsNavOpen(false);
  };

  const handleHistoryViewChange = (view: HistoryViewMode) =>
    handleTabChange("history", view);

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Leaf className="size-4.5" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-sidebar-foreground">
          ExpenseHub
        </span>
      </div>

      {/* Profile switcher */}
      <div className="px-3">
        <ProfileSwitcher />
      </div>

      {/* Navigation */}
      <nav className="px-3 py-2">
        <TabsList className="flex h-auto w-full flex-col items-stretch justify-start gap-1 rounded-none bg-transparent p-0">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-1 pb-4">
              <SectionLabel className="px-3 pb-1">{group.label}</SectionLabel>
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

      {/* The primary action sits with the navigation rather than in a topbar:
          it is the one thing you came here to do, and it should be in the same
          place whichever view you are on. */}
      <div className="px-3 pb-2">
        <Button className="h-11 w-full" onClick={() => openAddExpense()}>
          <Plus className="size-4.5" />
          Add expense
        </Button>
      </div>

      {/* User footer */}
      <div className="mt-auto border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/50 p-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {avatarInitial(email) ?? (
              <UserRound className="size-4" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-sidebar-foreground">
              {email}
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
      {/* First focusable element on the page. Without it a keyboard user tabs
          the profile switcher, the whole nav, Add expense and Sign out — an
          unconfirmed session-ending control — before reaching a single
          expense, on every visit. */}
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      {/* Desktop sidebar — pinned to the viewport, scrolls internally if needed */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile nav drawer — the full navigation and the account controls, for
          everything the four-item thumb bar deliberately leaves out. */}
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
        {/* Phone topbar — brand and account only. The page title lives with the
            content it titles, and navigation lives under the thumb. */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:hidden">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Leaf className="size-4.5" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            ExpenseHub
          </span>
          {/* The avatar is 36px, so the button pads out to a 44px hit area
              around it rather than making the circle itself bigger. */}
          <button
            type="button"
            aria-label="Open account menu"
            onClick={() => setIsNavOpen(true)}
            className="-mr-1 ml-auto flex size-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              {avatarInitial(email) ?? (
                <UserRound className="size-4" aria-hidden />
              )}
            </span>
          </button>
        </header>

        {/* Bottom padding clears the fixed thumb bar; without it the last card
            sits under the nav and reads as cut off. */}
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 px-4 pb-28 pt-5 outline-none sm:px-6 lg:px-8 lg:pb-10 lg:pt-8"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:gap-6">
            {query.error && (
              <Callout variant="error">
                {errorMessage(query.error, "Failed to load expenses")}
              </Callout>
            )}

            <TabsContent value="dashboard" className="mt-0">
              {query.isLoading ? (
                <SkeletonDashboard />
              ) : (
                <DashboardView
                  expenses={query.data || []}
                  greeting={greeting}
                  onAddExpense={openAddExpense}
                  onNavigate={handleTabChange}
                />
              )}
            </TabsContent>
            {/* History renders its own title beside its view switch. */}
            <TabsContent value="history" className="mt-0">
              <HistoryView
                expenses={query.data || []}
                isLoading={query.isLoading}
                view={historyView}
                onViewChange={handleHistoryViewChange}
                onAddExpense={(date) => openAddExpense("single", date)}
              />
            </TabsContent>
            <TabsContent value="analytics" className="mt-0 flex flex-col gap-4">
              <PageTitle>{TAB_TITLES.analytics}</PageTitle>
              {query.isLoading ? (
                <SkeletonAnalytics />
              ) : (
                <SpendingAnalytics expenses={query.data || []} />
              )}
            </TabsContent>
            <TabsContent value="settings" className="mt-0 flex flex-col gap-4">
              <PageTitle>{TAB_TITLES.settings}</PageTitle>
              <div className="flex max-w-2xl flex-col gap-6">
                <ProfilesSection />
                <CategoriesSection />
                <MerchantsSection />
              </div>
            </TabsContent>
          </div>
        </main>
      </div>

      {/* Phone thumb bar. Plain buttons rather than TabsTrigger: the sidebar
          already owns the tablist, and a second set of triggers for the same
          values would duplicate every generated id in the document. */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        {/* The FAB column is explicitly wider than the button plus its ring.
            On a 320px screen the ring bled ~2px into both neighbours and
            clipped the "History" and "Analytics" labels. */}
        <div className="mx-auto grid max-w-md grid-cols-[1fr_1fr_4.5rem_1fr_1fr] items-end px-2">
          {BOTTOM_NAV.slice(0, 2).map((item) => (
            <BottomNavItem
              key={item.value}
              {...item}
              isActive={activeTab === item.value}
              onSelect={handleTabChange}
            />
          ))}

          {/* Raised clear of the bar so the primary action reads as sitting
              on top of the navigation rather than as a fifth destination in
              it. The ring is the background colour, which cuts the bar's top
              border cleanly around the circle. */}
          <div className="flex h-14 items-center justify-center">
            <Button
              aria-label="Add expense"
              onClick={() => openAddExpense()}
              className="size-14 -translate-y-5 rounded-full shadow-lg ring-4 ring-background"
            >
              <Plus className="size-6" />
            </Button>
          </div>

          {BOTTOM_NAV.slice(2).map((item) => (
            <BottomNavItem
              key={item.value}
              {...item}
              isActive={activeTab === item.value}
              onSelect={handleTabChange}
            />
          ))}
        </div>
      </nav>

      <AddExpenseDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        initialTab={addTab}
        initialDate={addDate}
      />
      <Toaster />
    </Tabs>
  );
}

/** The heading for every view except the dashboard, which greets you instead. */
function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
      {children}
    </h1>
  );
}

interface BottomNavItemProps {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onSelect: (value: string) => void;
}

function BottomNavItem({
  value,
  label,
  icon: Icon,
  isActive,
  onSelect,
}: BottomNavItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        // 56px tall: the bar is the primary navigation on a phone and every
        // target in it has to clear the minimum comfortable tap size.
        "flex h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-5" />
      {label}
    </button>
  );
}
