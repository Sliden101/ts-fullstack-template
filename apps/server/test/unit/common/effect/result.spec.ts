import { describe, expect, it } from 'vitest';
import { fromResult } from '../../../../src/common/effect/result.ts';
import { err, ok } from '../../../../src/domain/shared/result.ts';
import { runEffectResult } from '../../../support/effect-test.ts';

describe('fromResult', () => {
  it('lifts an Ok into a successful effect', async () => {
    const result = await runEffectResult(fromResult(ok(42)));

    expect(result).toMatchObject({ _tag: 'Success', success: 42 });
  });

  it('lifts an Err into a failed effect', async () => {
    const result = await runEffectResult(
      fromResult(err({ code: 'X', message: 'nope', statusCode: 400 })),
    );

    expect(result).toMatchObject({ _tag: 'Failure' });
    if (result._tag === 'Failure') {
      expect(result.failure.code).toBe('X');
    }
  });
});
