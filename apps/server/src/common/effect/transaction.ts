import { Effect } from 'effect';
import type { SQL } from 'drizzle-orm';
import type { AppDatabase } from '../../database.ts';
import { tryDb } from './db.ts';
import { DbFailure } from './failures.ts';

export class EffectRollback<E> extends Error {
  constructor(readonly failure: E) {
    super('effect-rollback');
    this.name = 'EffectRollback';
  }
}

export interface EffectTransactionClient {
  execute: (query: SQL) => Promise<unknown>;
}

export function runInTransaction<A, E>(
  db: Pick<AppDatabase, 'transaction'>,
  body: (tx: EffectTransactionClient) => Effect.Effect<A, E>,
): Effect.Effect<A, E | DbFailure> {
  return tryDb(() =>
    db.transaction(async (tx) => {
      const result = await Effect.runPromise(
        Effect.result(body(tx as unknown as EffectTransactionClient)),
      );
      if (result._tag === 'Failure') {
        throw new EffectRollback(result.failure);
      }
      return result.success;
    }),
  ).pipe(
    Effect.catchIf(
      (failure): failure is DbFailure & { cause: EffectRollback<E> } =>
        failure instanceof DbFailure &&
        failure.cause instanceof EffectRollback,
      (failure) => Effect.fail((failure.cause as EffectRollback<E>).failure),
    ),
  );
}
