const createRoute = <
  TKey extends string,
  TPath extends `/` | `/${string}` | `/${string}/${string}`,
>(
  key: TKey,
  path: TPath,
): { key: TKey; path: TPath } => {
  return { key, path };
};

const appRoutes = [
  // `/` is the marketing homepage, so signing in has its own address. Every
  // link goes through `getPath` for exactly this reason — the auth entry point
  // moved without a single hardcoded "/" needing to be hunted down.
  createRoute("home", "/"),
  createRoute("login", "/login"),
  createRoute("register", "/register"),
  createRoute("logout", "/logout"),
  createRoute("dashboard", "/app"),
] as const;

type AppRoute = (typeof appRoutes)[number];
type AppRouteKey = AppRoute["key"];

const appRoutesMap = Object.fromEntries(
  appRoutes.map((route) => [route.key, route.path]),
) as { [K in AppRouteKey]: Extract<AppRoute, { key: K }>["path"] };

class AppRouter {
  static getPath = <TKey extends AppRouteKey>(
    key: TKey,
  ): (typeof appRoutesMap)[TKey] => {
    return appRoutesMap[key];
  };
}

/**
 * The signed-in app's destinations. Each tab is its own path so views
 * deep-link, survive reload and honour browser Back; History's calendar is a
 * nested path for the same reason. This is the one place that knows which
 * path a tab lives at — the client router, the nav and the legacy `?tab=`
 * redirect all ask here.
 */
const APP_TABS = ["dashboard", "history", "analytics", "settings"] as const;
type AppTab = (typeof APP_TABS)[number];

const HISTORY_VIEWS = ["list", "calendar"] as const;
type HistoryView = (typeof HISTORY_VIEWS)[number];

const isAppTab = (value: unknown): value is AppTab =>
  typeof value === "string" && (APP_TABS as readonly string[]).includes(value);

const appTabPath = (tab: AppTab, view: HistoryView = "list"): string =>
  tab === "history" && view === "calendar"
    ? "/app/history/calendar"
    : `/app/${tab}`;

export {
  AppRouter,
  APP_TABS,
  HISTORY_VIEWS,
  appTabPath,
  isAppTab,
  type AppTab,
  type HistoryView,
};
