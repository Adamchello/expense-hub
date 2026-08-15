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

export { AppRouter };
