import { Effect, Result } from 'effect';
import { vi, type Mock } from 'vitest';

export interface FakeDb {
  execute: Mock;
  transaction: Mock;
}

export function runEffect<A, E>(
  effect: Effect.Effect<A, E, never>,
): Promise<A> {
  return Effect.runPromise(effect);
}

export function runEffectResult<A, E>(
  effect: Effect.Effect<A, E, never>,
): Promise<Result.Result<A, E>> {
  return Effect.runPromise(Effect.result(effect));
}

export function makeFakeDb(): FakeDb {
  const db: FakeDb = {
    execute: vi.fn(),
    transaction: vi.fn(async (callback: (tx: unknown) => unknown) =>
      callback(db),
    ),
  };
  return db;
}
