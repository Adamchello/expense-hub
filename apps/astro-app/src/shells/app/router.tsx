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
const TAB_VALUES = [
  "dashboard",
  "history",
  "recurring",
  "analytics",
  "settings",
] as const;
type TabValue = (typeof TAB_VALUES)[number];

interface AppSearch {
  tab: TabValue;
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
  validateSearch: (search: Record<string, unknown>): AppSearch => ({
    tab: TAB_VALUES.includes(search.tab as TabValue)
      ? (search.tab as TabValue)
      : "dashboard",
  }),
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
