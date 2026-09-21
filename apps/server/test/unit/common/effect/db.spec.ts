import { describe, expect, it } from 'vitest';
import { tryDb } from '../../../../src/common/effect/db.ts';
import { DbFailure } from '../../../../src/common/effect/failures.ts';
import { runEffectResult } from '../../../support/effect-test.ts';

describe('tryDb', () => {
  it('resolves the promise value', async () => {
    const result = await runEffectResult(tryDb(async () => ({ rows: [] })));

    expect(result).toMatchObject({ _tag: 'Success' });
  });

  it('maps a rejection with a top-level code to DbFailure', async () => {
    const result = await runEffectResult(
      tryDb(async () => {
        throw Object.assign(new Error('duplicate'), { code: '23505' });
      }),
    );

    expect(result).toMatchObject({ _tag: 'Failure' });
    if (result._tag === 'Failure') {
      expect(result.failure).toBeInstanceOf(DbFailure);
      expect(result.failure.sqlState).toBe('23505');
    }
  });

  it('maps a nested cause code to DbFailure', async () => {
    const result = await runEffectResult(
      tryDb(async () => {
        throw { cause: { code: '40001' } };
      }),
    );

    expect(result).toMatchObject({ _tag: 'Failure' });
    if (result._tag === 'Failure') {
      expect(result.failure.sqlState).toBe('40001');
    }
  });
});
