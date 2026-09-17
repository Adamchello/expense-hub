"use client";

import { Link } from "@tanstack/react-router";
import {
  ChartColumn,
  LayoutDashboard,
  Leaf,
  Plus,
  Receipt,
  Settings,
} from "lucide-react";
import { Button } from "@/libs/ui/button";
import { SectionLabel } from "@/libs/ui/section-label";
import { cn } from "@/libs/ui/utils";
import { AccountFooter } from "./account-footer";
import { appTabPath, type AppTab } from "@/shared/routing/app-router";
import { ProfileSwitcher } from "@/modules/multi-profile-account/presentation/profile-switcher";
import { openAddExpense } from "@/modules/add-expense/core/intent";

export interface NavItem {
  tab: AppTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * The four destinations. The sidebar groups them; the phone's thumb bar shows
 * the same four flat, so a person moving between devices finds nothing
 * missing — Recurring folded into History, which is where a repeating charge
 * and the charges it already produced belong together.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { tab: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { tab: "history", label: "History", icon: Receipt },
  { tab: "analytics", label: "Analytics", icon: ChartColumn },
  { tab: "settings", label: "Settings", icon: Settings },
];

const NAV_GROUPS: readonly { label: string; tabs: readonly AppTab[] }[] = [
  { label: "Overview", tabs: ["dashboard", "history", "analytics"] },
  { label: "Account", tabs: ["settings"] },
];

const itemFor = (tab: AppTab): NavItem =>
  NAV_ITEMS.find((item) => item.tab === tab)!;

export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Leaf className="size-4.5" />
      </div>
      <span className="text-[15px] font-semibold tracking-tight text-sidebar-foreground">
        ExpenseHub
      </span>
    </div>
  );
}

interface SidebarNavProps {
  email: string | undefined;
  /** Fired after any destination is chosen — the mobile drawer closes on it. */
  onNavigate?: () => void;
}

/**
 * The navigation column: brand, profile, destinations, the primary action,
 * and the account footer. Rendered twice — pinned on desktop, in a drawer on
 * a phone — which is why it takes no layout of its own.
 *
 * Destinations are links, not tabs: the URL is the state. `replace` so Back
 * leaves the app instead of walking every view visited this session.
 */
export function SidebarNav({ email, onNavigate }: SidebarNavProps) {
  return (
    <>
      <Brand className="h-16 px-5" />

      <div className="px-3">
        <ProfileSwitcher />
      </div>

      <nav aria-label="Main" className="px-3 py-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1 pb-4">
            <SectionLabel className="px-3 pb-1">{group.label}</SectionLabel>
            {group.tabs.map(itemFor).map((item) => (
              <Link
                key={item.tab}
                to={appTabPath(item.tab)}
                replace
                onClick={onNavigate}
                className="flex items-center justify-start gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                activeProps={{
                  className:
                    "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent",
                  "aria-current": "page",
                }}
              >
                <item.icon className="size-4.5 shrink-0" />
                {item.label}
              </Link>
            ))}
          </div>
        ))}
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

      <div className="mt-auto border-t border-sidebar-border p-3">
        <AccountFooter email={email} />
      </div>
    </>
  );
}
