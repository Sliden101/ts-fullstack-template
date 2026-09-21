import { Effect } from 'effect';
import { dbFailureFrom, type DbFailure } from './failures.ts';

export function tryDb<A>(fn: () => Promise<A>): Effect.Effect<A, DbFailure> {
  return Effect.tryPromise({ try: fn, catch: dbFailureFrom });
}
