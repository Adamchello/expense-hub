/**
 * Server-only secrets, no request context needed.
 *
 * On Cloudflare Workers `process.env` carries `wrangler secret` values
 * (nodejs_compat + compatibility date >= 2025-04-01, both set in
 * wrangler.jsonc). In Astro dev, `.env` lands in `import.meta.env`. Check
 * both so one code path works everywhere.
 */
export const readSecret = (name: string): string | undefined => {
  const fromProcess =
    typeof process !== "undefined" ? process.env?.[name] : undefined;
  if (typeof fromProcess === "string" && fromProcess.length > 0) {
    return fromProcess;
  }

  const fromVite = (import.meta.env as Record<string, unknown>)[name];
  if (typeof fromVite === "string" && fromVite.length > 0) {
    return fromVite;
  }

  return undefined;
};
