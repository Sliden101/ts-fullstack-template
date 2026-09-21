import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { DbFailure } from '../../../../src/common/effect/failures.ts';
import {
  RequestTimeoutDefect,
  withResilience,
} from '../../../../src/common/effect/resilience.ts';
import { runEffectResult } from '../../../support/effect-test.ts';

function dbFailure(sqlState: string): DbFailure {
  return new DbFailure({ sqlState, detail: 'db', cause: {} });
}

describe('withResilience', () => {
  it('retries a transient DbFailure for an idempotent operation', async () => {
    let attempts = 0;
    const effect = Effect.gen(function* () {
      attempts += 1;
      if (attempts < 3) {
        return yield* Effect.fail(dbFailure('40001'));
      }
      return 'ok';
    });

    const result = await runEffectResult(
      withResilience(effect, { idempotent: true, retries: 3 }),
    );

    expect(result).toMatchObject({ _tag: 'Success', success: 'ok' });
    expect(attempts).toBe(3);
  });

  it('does not retry a non-transient DbFailure', async () => {
    let attempts = 0;
    const effect = Effect.gen(function* () {
      attempts += 1;
      return yield* Effect.fail(dbFailure('23505'));
    });

    const result = await runEffectResult(
      withResilience(effect, { idempotent: true, retries: 3 }),
    );

    expect(result._tag).toBe('Failure');
    expect(attempts).toBe(1);
  });

  it('never retries a non-idempotent operation', async () => {
    let attempts = 0;
    const effect = Effect.gen(function* () {
      attempts += 1;
      return yield* Effect.fail(dbFailure('40001'));
    });

    const result = await runEffectResult(
      withResilience(effect, { idempotent: false, retries: 3 }),
    );

    expect(result._tag).toBe('Failure');
    expect(attempts).toBe(1);
  });

  it('converts a timeout into a defect', async () => {
    await expect(
      Effect.runPromise(
        withResilience(Effect.sleep('100 millis'), {
          idempotent: false,
          timeoutMs: 10,
        }),
      ),
    ).rejects.toBeInstanceOf(RequestTimeoutDefect);
  });
});
