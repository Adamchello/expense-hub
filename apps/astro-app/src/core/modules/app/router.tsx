import { DashboardContent } from "./dashboard-content";
import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";

/** Tabs are driven by ?tab= so views deep-link, survive reload, and honor
 * browser Back. Unknown values fall back to the dashboard. */
const TAB_VALUES = ["dashboard", "history", "analytics", "settings"] as const;
type TabValue = (typeof TAB_VALUES)[number];

/** History's sub-view rides the URL too, so "the calendar" is a link. */
const VIEW_VALUES = ["list", "calendar"] as const;
type ViewValue = (typeof VIEW_VALUES)[number];

interface AppSearch {
  tab: TabValue;
  view: ViewValue;
}

const rootRoute = createRootRoute({
  component: () => {
    return (
      <div>
        <Outlet />
      </div>
    );
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app",
  validateSearch: (search: Record<string, unknown>): AppSearch => {
    // Recurring payments merged into History as its Incoming section. Old
    // links keep working — they land on the page that absorbed them.
    const tab =
      search.tab === "recurring"
        ? "history"
        : TAB_VALUES.includes(search.tab as TabValue)
          ? (search.tab as TabValue)
          : "dashboard";
    const view = VIEW_VALUES.includes(search.view as ViewValue)
      ? (search.view as ViewValue)
      : "list";
    return { tab, view };
  },
  component: () => {
    return <DashboardContent />;
  },
});

const routeTree = rootRoute.addChildren([dashboardRoute]);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const Router = () => <RouterProvider router={router} />;

export { Router };
