import type { APIContext } from "astro";

/**
 * Black-box test double for the Supabase server client.
 *
 * The procedure layer's only external dependency is the Supabase client
 * returned by `createSupabaseServerClient`. These helpers let a test declare,
 * declaratively, what that client returns for a given scenario — an
 * authenticated user (or none), per-table query responses, auth responses and
 * RPC responses — without the test knowing anything about how the handler
 * chains its query. Tests then assert only on the envelope the procedure
 * returns.
 */

/** A single resolved Supabase response (the shape every query awaits to). */
export type MockResponse = {
  data?: unknown;
  error?: unknown;
  count?: number | null;
};

/**
 * Per-table configuration. A single response is reused for every query to that
 * table; an array is a queue drained in order (the last entry is reused once
 * the queue is exhausted) — for handlers that hit the same table more than once.
 */
type TableConfig = MockResponse | MockResponse[];

export type SupabaseMockConfig = {
  /** The authenticated user, or `undefined`/`null` for an unauthenticated request. */
  user?: { id: string; email?: string | null } | null;
  /** Force `auth.getUser()` to resolve with an error. */
  userError?: unknown;
  /** Responses for `db.auth.*` calls used by the auth procedures. */
  auth?: {
    signUp?: MockResponse;
    signInWithPassword?: MockResponse;
    signOut?: { error?: unknown };
  };
  /** Responses keyed by table name (`db.from(table)`). */
  tables?: Record<string, TableConfig>;
  /**
   * Responses for `db.rpc(name)`. Either keyed by RPC name, or a single
   * response object reused for any RPC call.
   */
  rpc?: Record<string, MockResponse> | MockResponse;
};

const resolved = (response: MockResponse) => ({
  data: response.data ?? null,
  error: response.error ?? null,
  count: response.count ?? null,
});

/**
 * A chainable query builder whose every method returns itself and which is
 * awaitable (thenable), resolving to a fixed response.
 */
const makeChainable = (response: MockResponse) => {
  const result = resolved(response);

  const chain: Record<string, unknown> = {};
  const methods = [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "in",
    "order",
    "match",
    "single",
    "maybeSingle",
  ];
  for (const method of methods) {
    chain[method] = () => chain;
  }

  chain.then = (
    onFulfilled?: ((value: typeof result) => unknown) | null,
    onRejected?: ((reason: unknown) => unknown) | null,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  chain.catch = (onRejected?: ((reason: unknown) => unknown) | null) =>
    Promise.resolve(result).catch(onRejected);
  chain.finally = (onFinally?: (() => void) | null) =>
    Promise.resolve(result).finally(onFinally);

  return chain;
};

/**
 * Build a fake Supabase `db`. Pass it wherever the real client would be used
 * (typically by mocking `createSupabaseServerClient` to return it).
 */
export const buildSupabaseMock = (config: SupabaseMockConfig = {}) => {
  const queues: Record<string, MockResponse[]> = {};
  for (const [table, cfg] of Object.entries(config.tables ?? {})) {
    queues[table] = Array.isArray(cfg) ? [...cfg] : [cfg];
  }

  const nextResponse = (table: string): MockResponse => {
    const queue = queues[table];
    if (!queue || queue.length === 0) return { data: null, error: null };
    return queue.length === 1 ? queue[0] : (queue.shift() as MockResponse);
  };

  const resolveRpc = (name: string): MockResponse => {
    const rpc = config.rpc;
    if (!rpc) return { data: null, error: null };
    if ("data" in rpc || "error" in rpc || "count" in rpc) {
      return rpc as MockResponse;
    }
    const keyed = rpc as Record<string, MockResponse>;
    return keyed[name] ?? { data: null, error: null };
  };

  const user = config.user ?? null;

  return {
    auth: {
      getUser: async () => ({
        data: { user },
        error: config.userError ?? null,
      }),
      signUp: async () => config.auth?.signUp ?? { data: {}, error: null },
      signInWithPassword: async () =>
        config.auth?.signInWithPassword ?? { data: {}, error: null },
      signOut: async () => config.auth?.signOut ?? { error: null },
    },
    from: (table: string) => makeChainable(nextResponse(table)),
    rpc: (name: string) => makeChainable(resolveRpc(name)),
  };
};

/**
 * A minimal `APIContext` stub. Procedures only forward the context to
 * `createSupabaseServerClient`, which the tests mock, so its contents are
 * never inspected.
 */
export const buildContext = (): APIContext => ({}) as unknown as APIContext;
