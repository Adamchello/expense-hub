import {
  createRouter,
  createRoute,
  createRootRoute,
  redirect,
  HeadContent,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { appTabPath, isAppTab } from "@/shared/routing/app-router";
import { AppLayout } from "./app-layout";
import { AnalyticsPage } from "./pages/analytics-page";
import { DashboardPage } from "./pages/dashboard-page";
import { HistoryPage } from "./pages/history-page";
import { SettingsPage } from "./pages/settings-page";

/** The tab is the page, so the tab is the document title. */
const titled = (title: string) => () => ({
  meta: [{ title: `${title} · ExpenseHub` }],
});

const rootRoute = createRootRoute({
  component: () => (
    <>
      <HeadContent />
      <Outlet />
    </>
  ),
});

/** Every signed-in view shares the chrome; pages render through its outlet. */
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app",
  component: AppLayout,
});

/** `/app` has no content of its own — it lands you on the dashboard. Legacy
 * `?tab=` links (including the retired "recurring", which History absorbed)
 * keep working: they resolve to the equivalent path and redirect. */
const appIndexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/",
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
    view: typeof search.view === "string" ? search.view : undefined,
  }),
  beforeLoad: ({ search }) => {
    const requested = search.tab === "recurring" ? "history" : search.tab;
    const tab = isAppTab(requested) ? requested : "dashboard";
    const view = search.view === "calendar" ? "calendar" : "list";
    throw redirect({ to: appTabPath(tab, view), replace: true });
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "dashboard",
  head: titled("Dashboard"),
  component: DashboardPage,
});

const historyRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "history",
  head: titled("History"),
  component: () => <HistoryPage view="list" />,
});

const historyCalendarRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "history/calendar",
  head: titled("History"),
  component: () => <HistoryPage view="calendar" />,
});

const analyticsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "analytics",
  head: titled("Spending analytics"),
  component: AnalyticsPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "settings",
  head: titled("Settings"),
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  appRoute.addChildren([
    appIndexRoute,
    dashboardRoute,
    historyRoute,
    historyCalendarRoute,
    analyticsRoute,
    settingsRoute,
  ]),
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
