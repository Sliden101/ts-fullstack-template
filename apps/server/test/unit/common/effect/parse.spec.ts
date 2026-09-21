import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { parse } from '../../../../src/common/effect/parse.ts';
import { runEffectResult } from '../../../support/effect-test.ts';

const Schema = z.object({
  limit: z.number().int().min(1).max(200),
});

describe('parse', () => {
  it('succeeds with the parsed value', async () => {
    const result = await runEffectResult(parse(Schema, { limit: 50 }));

    expect(result).toMatchObject({ _tag: 'Success', success: { limit: 50 } });
  });

  it('fails with a VALIDATION_ERROR carrying field details', async () => {
    const result = await runEffectResult(parse(Schema, { limit: 500 }));

    expect(result).toMatchObject({ _tag: 'Failure' });
    if (result._tag === 'Failure') {
      expect(result.failure.code).toBe('VALIDATION_ERROR');
      expect(result.failure.statusCode).toBe(400);
      expect(result.failure.errors).toHaveLength(1);
      expect(result.failure.errors[0]).toMatchObject({
        path: 'limit',
        code: 'too_big',
      });
    }
  });
});
