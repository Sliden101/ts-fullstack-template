import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';
import {
  runInTransaction,
  EffectRollback,
} from '../../../../src/common/effect/transaction.ts';
import { DbFailure } from '../../../../src/common/effect/failures.ts';
import { domainError } from '../../../../src/domain/shared/errors.ts';
import { runEffectResult } from '../../../support/effect-test.ts';

function fakeTransactionDb() {
  return {
    transaction: vi.fn(async (callback: (tx: unknown) => unknown) =>
      callback({ execute: vi.fn() }),
    ),
  };
}

describe('runInTransaction', () => {
  it('commits and resolves the success value', async () => {
    const db = fakeTransactionDb();

    const result = await runEffectResult(
      runInTransaction(db as never, () => Effect.succeed('ok')),
    );

    expect(result).toMatchObject({ _tag: 'Success', success: 'ok' });
    expect(db.transaction).toHaveBeenCalledTimes(1);
  });

  it('rolls back and preserves a typed failure', async () => {
    const db = fakeTransactionDb();
    const failure = domainError('FAILED', 'nope', 400);

    const result = await runEffectResult(
      runInTransaction(db as never, () => Effect.fail(failure)),
    );

    expect(result._tag).toBe('Failure');
    if (result._tag === 'Failure') {
      expect(result.failure).toBe(failure);
      expect(result.failure).not.toBeInstanceOf(DbFailure);
    }
  });

  it('surfaces a database rejection as a DbFailure', async () => {
    const db = fakeTransactionDb();

    const result = await runEffectResult(
      runInTransaction(db as never, () =>
        Effect.tryPromise({
          try: async () => {
            throw { code: '23505' };
          },
          catch: (cause) =>
            new DbFailure({ sqlState: '23505', detail: 'dup', cause }),
        }),
      ),
    );

    expect(result._tag).toBe('Failure');
    if (result._tag === 'Failure') {
      expect(result.failure).toBeInstanceOf(DbFailure);
      expect((result.failure as DbFailure).sqlState).toBe('23505');
    }
  });

  it('exposes the rollback marker for internal use', () => {
    const marker = new EffectRollback(domainError('X', 'x', 400));

    expect(marker).toBeInstanceOf(Error);
    expect(marker.name).toBe('EffectRollback');
  });
});
