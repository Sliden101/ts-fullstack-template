import { Effect, Schedule } from 'effect';
import { DbFailure, isTransientDbFailure } from './failures.ts';

export interface ResilienceOptions {
  readonly idempotent: boolean;
  readonly timeoutMs?: number;
  readonly retries?: number;
}

export class RequestTimeoutDefect extends Error {
  constructor(readonly timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = 'RequestTimeoutDefect';
  }
}

export function withResilience<A, E, R>(
  effect: Effect.Effect<A, E, R>,
  options: ResilienceOptions,
): Effect.Effect<A, E, R> {
  let program: Effect.Effect<A, E, R> = effect;

  if (options.idempotent) {
    program = Effect.retry(program, {
      schedule: Schedule.exponential('50 millis'),
      times: options.retries ?? 3,
      while: (error) =>
        error instanceof DbFailure && isTransientDbFailure(error),
    }) as Effect.Effect<A, E, R>;
  }

  if (options.timeoutMs !== undefined) {
    const timeoutMs = options.timeoutMs;
    program = Effect.catchTag(
      Effect.timeout(program, timeoutMs),
      'TimeoutError',
      () => Effect.die(new RequestTimeoutDefect(timeoutMs)),
    ) as Effect.Effect<A, E, R>;
  }

  return program;
}
