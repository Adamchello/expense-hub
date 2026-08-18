/**
 * Thin fetch wrapper for the procedure-based API. Every endpoint speaks the
 * same protocol — JSON in, `{ code, ... }` out, errors as
 * `{ code, type, message }` — so repositories only declare path, payload,
 * and the success type.
 */

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly type?: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  /** Message used when the server response carries no usable one. */
  fallbackError?: string;
};

export const apiRequest = async <TResponse>(
  path: string,
  {
    method = "GET",
    body,
    signal,
    fallbackError = "Request failed",
  }: ApiRequestOptions = {},
): Promise<TResponse> => {
  const response = await fetch(path, {
    method,
    headers:
      body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = undefined;
  }

  if (!response.ok) {
    const error = data as
      { message?: string; error?: string; type?: string } | undefined;
    throw new ApiRequestError(
      error?.message || error?.error || fallbackError,
      response.status,
      error?.type,
    );
  }

  return data as TResponse;
};
