"use client";

import { useState } from "react";
import { Link, Outlet } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { Button } from "@/libs/ui/button";
import { Toaster } from "@/libs/ui/toaster";
import { cn } from "@/libs/ui/utils";
import { useAuth } from "@/shared/auth/use-auth";
import { UserAvatar } from "@/shared/user/user-avatar";
import { appTabPath } from "@/shared/routing/app-router";
import { AddExpenseDialog } from "@/modules/add-expense/presentation/add-expense-dialog";
import { openAddExpense } from "@/modules/add-expense/core/intent";
import { Brand, NAV_ITEMS, SidebarNav, type NavItem } from "./sidebar-nav";

/**
 * The chrome around every signed-in view: a pinned sidebar on desktop, a
 * topbar plus thumb bar plus drawer on a phone, and the one add-expense dialog
 * all of them open. Pages render through the outlet and own everything below
 * their own title.
 */
export function AppLayout() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const auth = useAuth();
  const email = auth.status === "authenticated" ? auth.user?.email : "";

  return (
    <div className="flex min-h-screen w-full flex-row gap-0 bg-background">
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
        <SidebarNav email={email} />
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
            <SidebarNav email={email} onNavigate={() => setIsNavOpen(false)} />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Phone topbar — brand and account only. The page title lives with the
            content it titles, and navigation lives under the thumb. */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:hidden">
          <Brand />
          {/* The avatar is 36px, so the button pads out to a 44px hit area
              around it rather than making the circle itself bigger. */}
          <button
            type="button"
            aria-label="Open account menu"
            onClick={() => setIsNavOpen(true)}
            className="-mr-1 ml-auto flex size-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <UserAvatar
              email={email}
              className="transition-opacity hover:opacity-90"
            />
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
            <Outlet />
          </div>
        </main>
      </div>

      {/* Phone thumb bar. */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        {/* The FAB column is explicitly wider than the button plus its ring.
            On a 320px screen the ring bled ~2px into both neighbours and
            clipped the "History" and "Analytics" labels. */}
        <div className="mx-auto grid max-w-md grid-cols-[1fr_1fr_4.5rem_1fr_1fr] items-end px-2">
          {NAV_ITEMS.slice(0, 2).map((item) => (
            <BottomNavItem key={item.tab} item={item} />
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

          {NAV_ITEMS.slice(2).map((item) => (
            <BottomNavItem key={item.tab} item={item} />
          ))}
        </div>
      </nav>

      <AddExpenseDialog />
      <Toaster />
    </div>
  );
}

function BottomNavItem({ item }: { item: NavItem }) {
  return (
    <Link
      to={appTabPath(item.tab)}
      replace
      className={cn(
        // 56px tall: the bar is the primary navigation on a phone and every
        // target in it has to clear the minimum comfortable tap size.
        "flex h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
      activeProps={{
        className: "text-primary hover:text-primary",
        "aria-current": "page",
      }}
    >
      <item.icon className="size-5" />
      {item.label}
    </Link>
  );
}
