import { DashboardContent } from "./dashboard-content";
import {
  createRouter,
  createRoute,
  createRootRoute,
  redirect,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";

/** Each tab is its own path so views deep-link, survive reload, and honour
 * browser Back. History's calendar is a nested path for the same reason. */
const TAB_PATHS = ["dashboard", "history", "analytics", "settings"] as const;
type TabPath = (typeof TAB_PATHS)[number];

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

/** `/app` has no content of its own — it lands you on the dashboard. Legacy
 * `?tab=` links (including the retired "recurring", which History absorbed)
 * keep working: they resolve to the equivalent path and redirect. */
const appIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app",
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
    view: typeof search.view === "string" ? search.view : undefined,
  }),
  beforeLoad: ({ search }) => {
    const requested = search.tab === "recurring" ? "history" : search.tab;
    const tab = TAB_PATHS.includes(requested as TabPath)
      ? (requested as TabPath)
      : "dashboard";
    const to =
      tab === "history" && search.view === "calendar"
        ? "/app/history/calendar"
        : tab === "history"
          ? "/app/history"
          : tab === "analytics"
            ? "/app/analytics"
            : tab === "settings"
              ? "/app/settings"
              : "/app/dashboard";
    throw redirect({ to, replace: true });
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app/dashboard",
  component: () => (
    <DashboardContent activeTab="dashboard" historyView="list" />
  ),
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app/history",
  component: () => <DashboardContent activeTab="history" historyView="list" />,
});

const historyCalendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app/history/calendar",
  component: () => (
    <DashboardContent activeTab="history" historyView="calendar" />
  ),
});

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app/analytics",
  component: () => (
    <DashboardContent activeTab="analytics" historyView="list" />
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app/settings",
  component: () => <DashboardContent activeTab="settings" historyView="list" />,
});

const routeTree = rootRoute.addChildren([
  appIndexRoute,
  dashboardRoute,
  historyRoute,
  historyCalendarRoute,
  analyticsRoute,
  settingsRoute,
]);

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
