import { Data, Effect } from 'effect';

/** A non-2xx or network failure from an upstream HTTP service. */
export class HttpFailure extends Data.TaggedError('HttpFailure')<{
  readonly status: number;
  readonly detail: string;
  readonly cause?: unknown;
}> {}

export function isHttpFailure(error: unknown): error is HttpFailure {
  return error instanceof HttpFailure;
}

/**
 * Fetch JSON from an absolute URL, failing with a typed {@link HttpFailure}
 * for non-2xx responses or network errors.
 */
export function fetchJson(
  url: string,
  init?: RequestInit,
): Effect.Effect<unknown, HttpFailure> {
  return Effect.tryPromise({
    try: async () => {
      const response = await fetch(url, init);
      if (!response.ok) {
        throw new HttpFailure({
          status: response.status,
          detail: `${response.status} ${response.statusText}`,
        });
      }
      return (await response.json()) as unknown;
    },
    catch: (error) =>
      error instanceof HttpFailure
        ? error
        : new HttpFailure({
            status: 0,
            detail: 'Network request failed',
            cause: error,
          }),
  });
}
